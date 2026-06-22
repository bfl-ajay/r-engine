declare module 'csv-parse/sync' {
  const parseSync: any;
  export = parseSync;
}

declare namespace xlsx {
  interface WorkBook {
    SheetNames: string[];
    Sheets: { [key: string]: any };
  }

  namespace utils {
    function sheet_to_json(sheet: any, options?: any): any[];
    function json_to_sheet(data: any[], options?: any): any;
    function book_new(): any;
    function book_append_sheet(book: any, sheet: any, name?: string): void;
  }
  function readFile(path: string): WorkBook;
  function writeFile(book: any, path: string): void;
}

declare module 'xlsx' {
  const x: typeof xlsx;
  export = x;
}

declare module 'mongodb' {
  export class MongoClient {
    constructor(uri?: string, opts?: any);
    connect(): Promise<any>;
    db(name?: string): any;
    close(): Promise<void>;
  }
  export type Db = any;
}

declare namespace mssql {
  interface ConnectionPool { connect(): Promise<void>; close(): Promise<void>; request(): any }
  interface config { [key: string]: any }
}

declare module 'mssql' {
  const m: any;
  export = m;
}

declare namespace mysql {
  interface Pool { getConnection(): Promise<any>; query(...args: any[]): Promise<any>; end(): Promise<void> }
}

declare module 'mysql2/promise' {
  const mysql: any;
  export = mysql;
}

declare namespace oracledb {
  interface Connection { execute(...args: any[]): Promise<any>; close(): Promise<void> }
}

declare module 'oracledb' {
  const o: any;
  export = o;
}

declare namespace pg {
  class Pool { constructor(opts?: any); connect(): Promise<any>; query(...args: any[]): Promise<any>; end(): Promise<void> }
  type PoolClient = any;
}

declare module 'pg' {
  export class Pool { constructor(opts?: any); connect(): Promise<any>; query(...args: any[]): Promise<any>; end(): Promise<void> }
  export type PoolClient = any;
}

