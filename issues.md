# Issue:1 

 approve-scripts <pkg>` to allow.
PS C:\Projects\r-engine> docker-compose up -d
time="2026-06-19T16:15:19+05:30" level=warning msg="C:\\Projects\\r-engine\\docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
[+] up 72/72
 ✔ Image rabbitmq:3.12-management-alpine Pulled                                      223.4s
 ✔ Image adminer                         Pulled                                      185.0s
 ✔ Image node:20-alpine                  Pulled                                      11.2ss
 ✔ Image postgres:15-alpine              Pulled                                      363.5s
 ✔ Image redis:7-alpine                  Pulled                                      75.4ss
 ✔ Image dpage/pgadmin4:latest           Pulled                                      350.2s
#1 [internal] load local bake definitions
#1 reading from stdin 538B done
#1 DONE 0.0s

#2 [internal] load build definition from Dockerfile
#2 transferring dockerfile: 1.89kB 0.1s done
#2 DONE 0.1s

#3 [internal] load metadata for docker.io/library/node:20-alpine
#3 DONE 0.2s

#4 [internal] load .dockerignore
#4 transferring context: 2B done
#4 DONE 0.0s

#5 [internal] load build context
#5 DONE 0.0s

#6 [backend-builder 1/8] FROM docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
#6 resolve docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 0.0s done
#6 CACHED

#7 [backend-runtime 2/9] WORKDIR /app
#7 CACHED

#5 [internal] load build context
#5 ...

#8 [backend-builder 2/8] WORKDIR /build
#8 DONE 1.6s

#9 [backend-runtime 3/9] RUN apk add --no-cache dumb-init
#9 ...

#5 [internal] load build context
#5 transferring context: 756.41kB 2.1s done
#5 DONE 2.1s

#10 [backend-builder 3/8] COPY package*.json ./
#10 DONE 0.1s

#11 [backend-builder 4/8] COPY apps/backend/ ./apps/backend/
#11 DONE 0.1s

#12 [backend-builder 5/8] COPY packages/ ./packages/
#12 DONE 0.1s

#9 [backend-runtime 3/9] RUN apk add --no-cache dumb-init
#9 ...

#13 [backend-builder 6/8] COPY tsconfig.json .eslintrc.json ./
#13 DONE 0.1s

#14 [backend-builder 7/8] RUN npm ci
#14 ...

#9 [backend-runtime 3/9] RUN apk add --no-cache dumb-init
#9 5.017 (1/1) Installing dumb-init (1.2.5-r3)
#9 5.156 Executing busybox-1.37.0-r30.trigger
#9 5.174 OK: 10.9 MiB in 19 packages
#9 DONE 5.3s

#15 [backend-runtime 4/9] COPY package*.json ./
#15 DONE 0.2s

#14 [backend-builder 7/8] RUN npm ci
#14 ...

#16 [backend-runtime 5/9] COPY apps/backend/package.json ./apps/backend/
#16 DONE 0.1s

#17 [backend-runtime 6/9] COPY packages/shared/package.json ./packages/shared/
#17 DONE 0.1s

#14 [backend-builder 7/8] RUN npm ci
#14 4.495 npm warn deprecated uuid@9.0.1: uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).
#14 6.808 npm warn deprecated supertest@6.3.4: Please upgrade to supertest v7.1.3+, see release notes at https://github.com/forwardemail/supertest/releases/tag/v7.1.3 - maintenance is supported by Forward Email @ https://forwardemail.net
#14 7.548 npm warn deprecated superagent@8.1.2: Please upgrade to superagent v10.2.2+, see release notes at https://github.com/forwardemail/superagent/releases/tag/v10.2.2 - maintenance is supported by Forward Email @ https://forwardemail.net
#14 8.462 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
#14 13.20 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
#14 ...

#18 [backend-runtime 7/9] RUN npm ci --production --workspaces
#18 0.635 npm warn config production Use `--omit=dev` instead.
#18 5.530 npm warn deprecated uuid@9.0.1: uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).
#18 ...

#14 [backend-builder 7/8] RUN npm ci
#14 14.23 npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
#14 22.18 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
#14 28.30 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
#14 28.33 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
#14 ...

#18 [backend-runtime 7/9] RUN npm ci --production --workspaces
#18 53.38 
#18 53.38 added 244 packages, and audited 247 packages in 53s
#18 53.38 
#18 53.38 32 packages are looking for funding
#18 53.38   run `npm fund` for details
#18 53.39 
#18 53.39 6 vulnerabilities (1 moderate, 5 high)
#18 53.39 
#18 53.39 To address issues that do not require attention, run:
#18 53.39   npm audit fix
#18 53.39 
#18 53.39 To address all issues (including breaking changes), run:
#18 53.39   npm audit fix --force
#18 53.39 
#18 53.39 Run `npm audit` for details.
#18 53.40 npm notice
#18 53.40 npm notice New major version of npm available! 10.8.2 -> 11.17.0
#18 53.40 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.17.0
#18 53.40 npm notice To update run: npm install -g npm@11.17.0
#18 53.40 npm notice
#18 DONE 53.9s

#14 [backend-builder 7/8] RUN npm ci
#14 156.0 
#14 156.0 added 493 packages, and audited 497 packages in 3m
#14 156.0 
#14 156.0 92 packages are looking for funding
#14 156.0   run `npm fund` for details
#14 156.4 
#14 156.4 17 vulnerabilities (4 moderate, 12 high, 1 critical)
#14 156.4 
#14 156.4 To address issues that do not require attention, run:
#14 156.4   npm audit fix
#14 156.4 
#14 156.4 To address all issues (including breaking changes), run:
#14 156.4   npm audit fix --force
#14 156.4 
#14 156.4 Run `npm audit` for details.
#14 156.4 npm notice
#14 156.4 npm notice New major version of npm available! 10.8.2 -> 11.17.0
#14 156.4 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.17.0
#14 156.4 npm notice To update run: npm install -g npm@11.17.0
#14 156.4 npm notice
#14 DONE 156.6s

#19 [backend-builder 8/8] RUN npm run build --workspace=@reporting-engine/backend
#19 0.894 
#19 0.894 > @reporting-engine/backend@1.0.0 build
#19 0.894 > tsc
#19 0.894 
#19 7.037 error TS6059: File '/build/apps/backend/src/index.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.037   The file is in the program because:
#19 7.037     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.037 error TS6059: File '/build/apps/backend/src/services/anomalyDetectionService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.037   The file is in the program because:
#19 7.037     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.037 error TS6059: File '/build/apps/backend/src/services/authenticationService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.037   The file is in the program because:
#19 7.037     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.039 error TS6059: File '/build/apps/backend/src/services/authorizationService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.039   The file is in the program because:
#19 7.039     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/chartService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/conditionalFormattingService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/connectors/excelConnector.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/connectors/mssqlConnector.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/connectors/oracleConnector.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/customFunctionsService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/drillDownService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/exportService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/filteringService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/forecastingService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/groupingService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/multiTenancyService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.041 error TS6059: File '/build/apps/backend/src/services/olapCubeService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.041   The file is in the program because:
#19 7.041     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.042 error TS6059: File '/build/apps/backend/src/services/performanceMonitoringService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.042   The file is in the program because:
#19 7.042     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.042 error TS6059: File '/build/apps/backend/src/services/pivotTableService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.042   The file is in the program because:
#19 7.042     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.042 error TS6059: File '/build/apps/backend/src/services/queryBuilder.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.042   The file is in the program because:
#19 7.042     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.042 error TS6059: File '/build/apps/backend/src/services/queryOptimizationService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.042   The file is in the program because:
#19 7.042     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.043 error TS6059: File '/build/apps/backend/src/services/reportCachingService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.043   The file is in the program because:
#19 7.043     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.043 error TS6059: File '/build/apps/backend/src/services/reportSchedulingService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.043   The file is in the program because:
#19 7.043     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.043 error TS6059: File '/build/apps/backend/src/services/runningTotalsService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.043   The file is in the program because:
#19 7.043     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.043 error TS6059: File '/build/apps/backend/src/services/sortingService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.043   The file is in the program because:
#19 7.043     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.043 error TS6059: File '/build/apps/backend/src/services/statisticalAnalysisService.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.043   The file is in the program because:
#19 7.043     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.043 error TS6059: File '/build/apps/backend/src/types/index.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
#19 7.043   The file is in the program because:
#19 7.043     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
#19 7.083 npm error Lifecycle script `build` failed with error:
#19 7.084 npm error code 2
#19 7.085 npm error path /build/apps/backend
#19 7.085 npm error workspace @reporting-engine/backend@1.0.0
#19 7.085 npm error location /build/apps/backend
#19 7.085 npm error command failed
#19 7.085 npm error command sh -c tsc
#19 ERROR: process "/bin/sh -c npm run build --workspace=@reporting-engine/backend" did not complete successfully: exit code: 2
------
 > [backend-builder 8/8] RUN npm run build --workspace=@reporting-engine/backend:
7.043 error TS6059: File '/build/apps/backend/src/types/index.ts' is not under 'rootDir' '/build/src'. 'rootDir' is expected to contain all source files.
7.043   The file is in the program because:
7.043     Matched by include pattern 'src' in '/build/apps/backend/tsconfig.json'
7.083 npm error Lifecycle script `build` failed with error:
[+] up 72/73ror code 2
 ✔ Image rabbitmq:3.12-management-alpine Pulled                                      223.4s
 ✔ Image adminer                         Pulled                                      185.0s
 ✔ Image node:20-alpine                  Pulled                                      11.2s
 ✔ Image postgres:15-alpine              Pulled                                      363.5s
 ✔ Image redis:7-alpine                  Pulled                                      75.4s
 ✔ Image dpage/pgadmin4:latest           Pulled                                      350.2s
 - Image r-engine-backend                Building                                    168.0s
Dockerfile:11

--------------------

   9 |     COPY tsconfig.json .eslintrc.json ./

  10 |     RUN npm ci

  11 | >>> RUN npm run build --workspace=@reporting-engine/backend

  12 |     

  13 |     # Stage 2: Build frontend

--------------------

failed to solve: process "/bin/sh -c npm run build --workspace=@reporting-engine/backend" did not complete successfully: exit code: 2