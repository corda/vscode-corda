import { Uri, ExtensionContext, workspace } from 'vscode';
const { 
  parse,
  BaseJavaCstVisitorWithDefaults
} = require("java-parser");

// STRUCTURES ======

// represents a class signature from a .java
export class ClassSig {
  name : string;
  superClass: string;
  superInterfaces: string[];
  file: Uri | undefined;
  constructor(name: string, superClass: string, superInterfaces: string[], file: Uri | undefined) {
      this.name = name;
      this.superClass = superClass;
      this.superInterfaces = superInterfaces;
      this.file = file;
  }
}

// represents an interface signature from a .java
export class InterfaceSig {
  name: string;
  superInterface: string;
  file: Uri | undefined;
  constructor(name: string, superInterface: string, file: Uri | undefined) {
      this.name = name;
      this.superInterface = superInterface;
      this.file = file;
  }
}

// visitor for CST tree traversal
class ClassTypeVisitor extends BaseJavaCstVisitorWithDefaults {
  constructor() {
      super();
      this.workingFile = undefined; // store file URI for a particular visit
      this.classSigs = [];
      this.interfaceSigs = [];
      this.validateVisitor();
  }

  setWorkingFile(file: Uri) {
      this.workingFile = file;
  }

  normalClassDeclaration(ctx: any) {
      const name = this.visit(ctx.typeIdentifier);
      const superClass = this.visit(ctx.superclass);
      const superInterfaces = this.visit(ctx.superinterfaces);
      if (superClass != undefined || superInterfaces != undefined) {
          this.classSigs.push(
              new ClassSig(name, superClass, superInterfaces, this.workingFile)
          );
      } 
  }

  normalInterfaceDeclaration(ctx: any) {
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
}

// FUNCTIONS ===========

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

	return extractTypes(ctVisitor);	

}

// extracts ContractStates, Contracts, and Flows from visitor results
const extractTypes = (ctVisitor: ClassTypeVisitor) => {
    const contractStateBaseInterfaces = ['ContractState', 'FungibleState', 'LinearState', 'OwnableState', 'QueryableState', 'SchedulableState'];
    const contractBaseInterface = ['Contract'];
    const flowBaseClassSig = [new ClassSig('FlowLogic', '', [], undefined)];
    const contractStateInterfaceSigs = contractStateBaseInterfaces.map(itr => { return new InterfaceSig(itr, '', undefined); });
    const contractInterfaceSig = contractBaseInterface.map(itr => { return new InterfaceSig(itr, '', undefined); });

    // ContractState
    const contractStatesData = extractTypesFromBase(contractStateInterfaceSigs, { interfaceSigs: ctVisitor.interfaceSigs,  classSigs: ctVisitor.classSigs });

    // Contract
    const contractsData = extractTypesFromBase(contractInterfaceSig, { interfaceSigs: contractStatesData.remainingInterfaceSigs,  classSigs: contractStatesData.remainingClassSigs });

    // Flows
    const flowsData = extractTypesFromBase(flowBaseClassSig, { interfaceSigs: contractsData.remainingInterfaceSigs, classSigs:  contractsData.remainingClassSigs});
    return {contractStateTypes: contractStatesData.baseTypeClasses, contractTypes: contractsData.baseTypeClasses, flowTypes: flowsData.baseTypeClasses};
}

const extractTypesFromBase = (targetSigs: any[], {interfaceSigs, classSigs}:{interfaceSigs: InterfaceSig[], classSigs: ClassSig[]}) => {
    
    let baseTypeClasses: any;
    let remainingInterfaceSigs: InterfaceSig[];
    let remainingClassSigs: ClassSig[];

    if (targetSigs[0] instanceof InterfaceSig) {
        let interfaces:InterfaceSig[] = [];
        // all interfaces which are derived from baseType (if applicable)
        interfaces = findChildTypes(targetSigs, interfaceSigs);
        targetSigs = targetSigs.concat(interfaces);
        remainingInterfaceSigs = interfaceSigs.filter(sigs => {return !interfaces.includes(sigs)});

        // all classes derived from baseType interfaces (if applicable)
        baseTypeClasses = findChildTypes(targetSigs, classSigs);
        remainingClassSigs = classSigs.filter(sigs => {return !baseTypeClasses.includes(sigs)});
    } else {  // flows derive ONLY from class extension - targetSigs ClassSig[]
        baseTypeClasses = [];
        remainingInterfaceSigs = [];
        remainingClassSigs = classSigs;
    }
    
    // all classes derived from another class
    baseTypeClasses = baseTypeClasses.concat(findChildTypes(
        (targetSigs[0] instanceof ClassSig) ? targetSigs : baseTypeClasses,
        remainingClassSigs));
    remainingClassSigs = remainingClassSigs.filter(sigs => {return !baseTypeClasses.includes(sigs)});

    return { baseTypeClasses, remainingInterfaceSigs, remainingClassSigs };
}

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
