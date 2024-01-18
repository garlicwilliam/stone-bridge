import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { DatabaseState, DatabaseStateRef, DatabaseStateTree } from '../interface';
import * as _ from 'lodash';

class DBStateReference implements DatabaseStateRef {
  private root: DatabaseStateTree<any> | null = null;

  constructor(private refPath: string) {}

  public setRoot(root: DatabaseStateTree<any>) {
    this.root = root;
    return this;
  }

  public getRef(): Observable<DatabaseState<any> | null> {
    return of(this.refPath).pipe(
      map((path: string) => {
        if (_.has(this.root, path)) {
          return _.get(this.root, path) as DatabaseState<any>;
        } else {
          return null;
        }
      })
    );
  }

  public getPath(): string {
    return this.refPath;
  }
}

function Ref(path: string): DatabaseStateRef {
  return new DBStateReference(path);
}

export const DATABASE_STATE = {
  Stone: {},
};
