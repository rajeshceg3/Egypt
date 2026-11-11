export function makeRng(seed?: number):()=>number;
export function renderWindLoop(sr:number,params:Record<string,number>,rng:()=>number):{left:Float32Array;right:Float32Array};
