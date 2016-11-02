
import ToDo from './todo';
import Roller from './roller';
import * as bb from 'bluebird';

function* arr2Gen<T>(arr: Array<T>): IterableIterator<T> {
    yield* arr;
}

export default function roll<Ti, To>(gen: Array<Ti> | IterableIterator<Ti>, fn: (t: Ti) => bb<To>, rlimit: number): bb<Array<To>> {
    if (rlimit <= 0 || Math.ceil(rlimit) !== rlimit) return bb.reject(new Error('rlimit must be a positive integer'));
    var gen2: IterableIterator<Ti> = null;
    if (Array.isArray(gen)) gen2 = arr2Gen(gen);
    else gen2 = gen;
    const rolls = new Array<Roller<Ti, To>>(rlimit), todo = new ToDo<Ti, To>(gen2);
    for (var i = 0; i < rlimit; ++i) {
        rolls[i] = new Roller(todo, fn);
    }
    return bb.all(rolls.map(r => r.roll()))
        .then(() => {
            return todo.results.map(r => r.result);
        })
}
