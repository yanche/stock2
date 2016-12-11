
export function rtplanScopeContains(target: string, scope: { type?: string, pack?: any }): boolean {
    switch (scope.type) {
        case 'allstocks': {
            const t = target.slice(6).toUpperCase();
            return t === '.XSHE' || t === '.XSHG';
        }
        case 'in': return (<Array<string>>scope.pack).some(t => t === target);
        case 'nin': return (<Array<string>>scope.pack).every(t => t !== target);
        default: throw new Error(`unknown scope type: ${scope.type}`);
    }
}
