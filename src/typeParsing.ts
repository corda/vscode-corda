const { 
  parse,
  BaseJavaCstVisitorWithDefaults
} = require("java-parser");

export class ClassSig {
  name : any;
  superClass: any;
  superInterfaces: any;
  constructor(name, superClass, superInterfaces) {
      this.name = name;
      this.superClass = superClass;
      this.superInterfaces = superInterfaces;
  }
}

export class InterfaceSig {
  name: any;
  superInterface: any;
  constructor(name, superInterface) {
      this.name = name;
      this.superInterface = superInterface;
  }
}

export class ClassTypeVisitor extends BaseJavaCstVisitorWithDefaults {
  constructor() {
      super();
      this.classSigs = [];
      this.interfaceSigs = [];
      this.validateVisitor();
  }

  normalClassDeclaration(ctx: any) {
      const name = this.visit(ctx.typeIdentifier);
      const superClass = this.visit(ctx.superclass);
      const superInterfaces = this.visit(ctx.superinterfaces);
      if (superClass != undefined || superInterfaces != undefined) {
          this.classSigs.push(
              new ClassSig(name, superClass, superInterfaces)
          );
      } 
  }

  normalInterfaceDeclaration(ctx: any) {
      const name = this.visit(ctx.typeIdentifier)
      const superInterface = this.visit(ctx.extendsInterfaces);
      if (superInterface != undefined) {
          this.interfaceSigs.push(
              new InterfaceSig(name, superInterface[0])
          );
      }
  }

  extendsInterfaces(ctx: any) {
      return this.visit(ctx.interfaceTypeList);
  }

  superclass(ctx: any) {
      // return ctx.classType[0].children.Identifier[0].image;
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

export const extractContractStates = (ctVisitor: ClassTypeVisitor) => {
    let contractStateInterfaces = ['ContractState', 'FungibleState', 'LinearState', 'OwnableState', 'QueryableState', 'SchedulableState'];
    let csInterfaceSigs = contractStateInterfaces.map(itr => { return new InterfaceSig(itr, undefined); });


	// all interfaces which are derived from ContractState
    let interfaces = findCSChildTypes(csInterfaceSigs, ctVisitor.interfaceSigs);
    csInterfaceSigs = csInterfaceSigs.concat(interfaces);

    // all classes derived from all interfaces
    let  states = findCSChildTypes(csInterfaceSigs, ctVisitor.classSigs);
    let remainingClassSigs = ctVisitor.classSigs.filter(sigs => {return !states.includes(sigs)});

    // all classes derived from all classes
    return states.concat(findCSChildTypes(states, remainingClassSigs));
}

const findCSChildTypes = (typesToMatch, typeSigs) => {
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
        return foundTypes.concat(findCSChildTypes(foundTypes, remainingSigs));
    }

    return foundTypes;
}
