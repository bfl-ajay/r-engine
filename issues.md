Frontend: 


> @reporting-engine/frontend@1.0.0 dev

> vite


sh: vite: not found

npm error Lifecycle script `dev` failed with error:

npm error code 127

npm error path /app/apps/frontend

npm error workspace @reporting-engine/frontend@1.0.0

npm error location /app/apps/frontend

npm error command failed

npm error command sh -c vite


--------------------------------------

Backend:

node:internal/modules/cjs/loader:1210

  throw err;

  ^


Error: Cannot find module '/app/dist/index.js'

    at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)

    at Module._load (node:internal/modules/cjs/loader:1038:27)

    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12)

    at node:internal/main/run_main_module:28:49 {

  code: 'MODULE_NOT_FOUND',

  requireStack: []

}


Node.js v20.20.2

node:internal/modules/cjs/loader:1210

  throw err;

  ^


Error: Cannot find module '/app/dist/index.js'

    at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)

    at Module._load (node:internal/modules/cjs/loader:1038:27)

    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12)

    at node:internal/main/run_main_module:28:49 {

  code: 'MODULE_NOT_FOUND',

  requireStack: []

}


Node.js v20.20.2