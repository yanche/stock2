
import ToDo from './todo';
import * as bb from 'bluebird';

export default class Roller<Ti, To>{
    private _todo: ToDo<Ti, To>;
    private _fn: (data: Ti) => bb<To>;

    constructor(todo: ToDo<Ti, To>, fn: (data: Ti) => bb<To>) {
        this._todo = todo;
        this._fn = fn;
    }
    roll(): bb<void> {
        return this._todo.dispatch()
            .then(task => {
                if (!task.end) {
                    return this._fn(task.data)
                        .then(data => {
                            task.result.set(true, data);
                        }, (err: Error) => {
                            task.result.set(false, null, err);
                        })
                        .then(() => {
                            return this.roll();
                        })
                }
            });
    }
}
