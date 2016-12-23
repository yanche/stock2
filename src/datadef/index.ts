
export interface TargetInfo {
    name: string;
    target: string;
    listDayTs: number;
}

// export interface DailyTargetData {
//     d: number; //day-ts
//     s: number;
//     e: number;
//     h: number;
//     l: number;
//     ex?: number;
//     v: number;
//     mv?: number;
//     nr?: number;
//     p?: number;
// }

export interface RawDataSlice {
    s: number,
    e: number,
    h: number,
    l: number,
    ex?: number,
    nr?: number,
    mv?: number,
    v: number
}

export interface RawData {
    data: { [key: string]: RawDataSlice },
    minDay: string,
    maxDay: string
}
