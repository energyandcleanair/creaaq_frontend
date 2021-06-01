# creaaq_frontend

## Project setup

1. Install dependencies

    ```sh
    npm install
    ```

2. Set the environment variables. There are the `.env.*` file at the root of
the project with the default/example values. Copy these files as `.env.*.local`
and fill all the variables before running the app. The files `.env.*.local`
will not be saved to GIT.


## Development

### Compiles and hot-reloads for development

    ```sh
    npm run dev
    ```

### Compiles and minifies for production

    ```sh
    npm run build
    ```

### Run your unit tests

    ```sh
    npm run test:unit
    ```

### Lints and fixes files

    ```sh
    npm run lint
    ```


## Deploy to Google App Engine

1. Bump the app files version. The command will create a new GIT tag. The step is not required.

    ```sh
    npm run bump
    ```

2. Push updates to the master branch. The deployment pipeline will deploy the new version on App Engine automatically.

    ```sh
    npm run deploy
    ```
