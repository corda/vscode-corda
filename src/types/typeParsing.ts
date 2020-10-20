import { Uri, ExtensionContext, workspace } from 'vscode';
import { Constants, WorkStateKeys } from './CONSTANTS';
const { 
  parse,
  BaseJavaCstVisitorWithDefaults
} = require("java-parser");

// STRUCTURES ======

/**
 * Represents an ambigious Object signature
 */
export abstract class ObjectSig {
    name: string;
    file: Uri | undefined;
    constructor(name: string, file: Uri | undefined) {
        this.name = name;
        this.file = file;
    } 
}

/**
 * Represents a Corda Class (inherits from ContractState, Contract, or FlowLogic)
 */
export class ClassSig extends ObjectSig {
  superClass: string | undefined;
  superInterfaces: string[];
  boundTo: string | undefined;
  constructor(name: string, superClass: string | undefined, superInterfaces: string[], boundTo: string | undefined, file: Uri | undefined) {
      super(name, file);
      this.superClass = superClass;
      this.superInterfaces = superInterfaces;
      this.boundTo = boundTo;
  }
}

/**
 * Represents a Corda Interface (inherits from ContractState, or Contract)
 */
export class InterfaceSig extends ObjectSig {
  superInterface: string;
  constructor(name: string, superInterface: string, file: Uri | undefined) {
      super(name, file);
      this.superInterface = superInterface;
  }
}

/**
 * Visitor for parsing CST tree and returning Corda Classes / Interfaces
 */
class ClassTypeVisitor extends BaseJavaCstVisitorWithDefaults {
  constructor() {
      super();
      this.workingFile = undefined; // store file URI for a particular visit (what file does this object belong)
      this.classSigs = []; // list of Corda Classes
      this.interfaceSigs = []; // list of Corda Interfaces
      this.currentBoundTo = undefined;
      this.validateVisitor();
  }

  setWorkingFile(file: Uri) {
      this.workingFile = file;
  }
  setCurrentBoundTo(boundTo: string | undefined) {
      this.currentBoundTo = boundTo;
  }

  classDeclaration(ctx: any) {
      this.setCurrentBoundTo(undefined); // reset class level boundTo
      this.visit(ctx.classModifier); // go to annotation if exist
      const classDetails: {name, superClass, superInterfaces} = this.visit(ctx.normalClassDeclaration);

      if (classDetails.superClass != undefined || classDetails.superInterfaces != undefined) {
          this.classSigs.push(
              new ClassSig(classDetails.name, classDetails.superClass, classDetails.superInterfaces, this.currentBoundTo, this.workingFile)
          );
      } 
  }

  // Visits all class declarations in CST
  normalClassDeclaration(ctx: any) {
      this.visit(ctx.classBody); // check class body for embedded classes
      const name = this.visit(ctx.typeIdentifier);
      const superClass = this.visit(ctx.superclass);
      const superInterfaces = this.visit(ctx.superinterfaces);
      return {name, superClass, superInterfaces};
  }

  // Visits all interface declarations in CST
  normalInterfaceDeclaration(ctx: any) {
      this.visit(ctx.interfaceBody); // check interface body for embedded classes
      const name = this.visit(ctx.typeIdentifier)
      const superInterface = this.visit(ctx.extendsInterfaces);
      if (superInterface != undefined) {
          this.interfaceSigs.push(
              new InterfaceSig(name, superInterface[0], this.workingFile)
          );
      }
  }

  extendsInterfaces(ctx: any) {
      return this.visit(ctx.interfaceTypeList);
  }

  superclass(ctx: any) {
      return this.visit(ctx.classType);
  }

  superinterfaces(ctx: any) {
      return this.visit(ctx.interfaceTypeList);
  }

  interfaceTypeList(ctx: any) {
      const list: InterfaceSig[] = [];
      ctx.interfaceType.forEach(iType => {
          list.push(this.visit(iType));
      })
      return list;
  }

  interfaceType(ctx: any) {
      return this.visit(ctx.classType);
  }

  classType(ctx: any) {
      return ctx.Identifier[0].image;
  }

  typeIdentifier(ctx: any) {
      return ctx.Identifier[0].image;
  }

//   classModifier(ctx: any) {
//       return;
//   }

  annotation(ctx: any) {
      const annotationValue = ctx.typeName[0].children.Identifier[0].image;
      switch (annotationValue) {
          case 'BelongsToContract':
          case 'InitiatedBy':
            this.visit(ctx.elementValue);
      }
  }

  fqnOrRefTypePartCommon(ctx: any) {
      this.setCurrentBoundTo(ctx.Identifier[0].image);
  }
 }

// FUNCTIONS ===========

/**
 * Entry point for a FULL project workspace parsing
 * - creates CST
 * - identifies all .java files and creates URI
 * - visits each URI resolving all Corda Classes / Interfaces
 * @param context 
 */
export const parseJavaFiles = async (context: ExtensionContext) => {
	var { parse } = require("java-parser");

	const localJavaFiles: Uri[] = await workspace.findFiles('**/*.java');
	const ctVisitor: ClassTypeVisitor = new ClassTypeVisitor();

	// visit all files and parse to prospect objects which have inheritance
	for (let i = 0; i < localJavaFiles.length; i++) {
		const fileUri = localJavaFiles[i];
		const uInt8file = await workspace.fs.readFile(fileUri);
		let cst = parse(uInt8file.toString());
		ctVisitor.setWorkingFile(fileUri);
		ctVisitor.visit(cst);
	}
    await context.workspaceState.update(WorkStateKeys.PROJECT_OBJECTS, extractTypes(ctVisitor));
}

/**
 * Helper function to accumulate results for States, Contracts, Flows
 * @param ctVisitor 
 * @returns dictionary of project classes and project interfaces.
 */
const extractTypes = (ctVisitor: ClassTypeVisitor) => {
    const flowBaseClassSig = [new ClassSig(Constants.FLOW_BASE_CLASS[0], undefined, [],undefined, undefined)];
    const contractStateInterfaceSigs = Constants.CONTRACTSTATE_BASE_INTERFACES.map(itr => { return new InterfaceSig(itr, '', undefined); });
    const contractInterfaceSig = Constants.CONTRACT_BASE_INTERFACE.map(itr => { return new InterfaceSig(itr, '', undefined); });

    // ContractState
    const contractStatesData = extractTypesFromBase(contractStateInterfaceSigs, ctVisitor.interfaceSigs,  ctVisitor.classSigs);

    // Contract
    const contractsData = extractTypesFromBase(contractInterfaceSig, contractStatesData.remainingInterfaceSigs,  contractStatesData.remainingClassSigs);

    // Flows
    const flowsData = extractTypesFromBase(flowBaseClassSig, contractsData.remainingInterfaceSigs, contractsData.remainingClassSigs);
    return {
        projectClasses: {contractStateClasses: contractStatesData.baseTypeClasses, contractClasses: contractsData.baseTypeClasses, flowClasses: flowsData.baseTypeClasses},
        projectInterfaces:{contractStateInterfaces: contractStatesData.baseTypeInterfaces, contractInterfaces: contractsData.baseTypeInterfaces}
    }
}

/**
 * Extract all descendants of a list of Classes/Interfaces.
 * @param targetSigs // base Classes/Interfaces
 * @param interfaceSigs // possible descendant interfaces
 * @param classSigs  // possible descendant classes
 * 
 * interfaces from base interfaces,
 * classes from base interfaces or inherited interfaces
 * classes extended from classes from base interfaces or inherited interfaces
 */
const extractTypesFromBase = (targetSigs: any[], interfaceSigs: InterfaceSig[], classSigs: ClassSig[]) => {
    
    let baseTypeClasses: any; // 
    let baseTypeInterfaces:InterfaceSig[] = [];
    let remainingInterfaceSigs: InterfaceSig[];
    let remainingClassSigs: ClassSig[];

    if (targetSigs[0] instanceof InterfaceSig) {
        // all interfaces which are derived from baseType (if applicable)
        baseTypeInterfaces = findChildTypes(targetSigs, interfaceSigs);
        targetSigs = targetSigs.concat(baseTypeInterfaces);
        remainingInterfaceSigs = interfaceSigs.filter(sigs => {return !baseTypeInterfaces.includes(sigs)});

        // all classes derived from baseType interfaces plus derived interfaces (if applicable)
        baseTypeClasses = findChildTypes(targetSigs, classSigs);
        remainingClassSigs = classSigs.filter(sigs => {return !baseTypeClasses.includes(sigs)});
    } else {  // flows derive ONLY from class extension - targetSigs ClassSig[]
        baseTypeClasses = [];
        remainingInterfaceSigs = [];
        remainingClassSigs = classSigs;
    }
    
    // all classes derived from another class which has parent baseType interface or derived interface
    baseTypeClasses = baseTypeClasses.concat(findChildTypes(
        (targetSigs[0] instanceof ClassSig) ? targetSigs : baseTypeClasses,
        remainingClassSigs));
    remainingClassSigs = remainingClassSigs.filter(sigs => {return !baseTypeClasses.includes(sigs)});

    return { baseTypeClasses, baseTypeInterfaces, remainingInterfaceSigs, remainingClassSigs };
}

/**
 * Recursively returns all Objects derived from param typesToMatch.
 * @param typesToMatch 
 * @param typeSigs 
 */
const findChildTypes = (typesToMatch, typeSigs) => {
    if (typesToMatch.length == 0) return []; // base case

    let foundTypes: any = [];
    // filter against typesToMatch list
    if (typeSigs[0] instanceof InterfaceSig) { // Matching interfaces against interfaces
        foundTypes = typeSigs.filter((val) => { 
            if (val.superInterface) {
                return typesToMatch.some(t => val.superInterface == t.name);
            } else {
                return false;
            }
        });
    } else if (typesToMatch[0] instanceof InterfaceSig) { // Matching classes against interfaces
        foundTypes = typeSigs.filter((val) => {
            if (val.superInterfaces) {
                return typesToMatch.some(t => val.superInterfaces.includes(t.name));
            } else {
                return false;
            }
        });
    } else if (typesToMatch[0] instanceof ClassSig) { // Matching classes against classes
        foundTypes = typeSigs.filter((val) => {    
            if (val.superClass) {
                return typesToMatch.some(t => val.superClass == t.name);
            } else {
                return false;
            }
        });           
    }
       
    // if child interfaces found, remove these interfaces from the Sig list and recurse to find children of these
     if (foundTypes.length > 0) {
        const remainingSigs = typeSigs.filter((sig: any) => { return !foundTypes.includes(sig) });
        // Sig to InterfaceName
        // let foundTypesNames = foundTypes.map(inter => inter.name);
        return foundTypes.concat(findChildTypes(foundTypes, remainingSigs));
    }

    return foundTypes;
}
