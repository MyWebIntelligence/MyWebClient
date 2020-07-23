# MyWebClient

ReactJS client application for cleaning, qualification and other stuff in MyWebIntelligence project.
This project relies on [MyWebIntelligencePython](https://github.com/MyWebIntelligence/MyWebIntelligencePython) project
as it queries its database, you have to install it first and have it to generate some data to play with.

This app actually runs two services concurrently, the ReactJS client itself (GUI) and the server API required to query SQLite database. 

# Installation from source

## Requirements

* [Git](https://git-scm.com/downloads)
* [NodeJS](https://nodejs.org/en/download/)  v12.16
* [Yarn](https://classic.yarnpkg.com/en/docs/install) package manager v1.22
* [MyWebIntelligencePython](https://github.com/MyWebIntelligence/MyWebIntelligencePython) 

## Installation

Clone project

```
> git clone https://github.com/MyWebIntelligence/MyWebClient.git
```

Enter project directory

```
> cd MyWebClient
```

Install dependencies

```
MyWebClient> yarn install
```

Client dependencies should install subsequently (postinstall lifecycle event)

## Start application

Inside project root directory, launch server and client app concurrently

```
MyWebClient> yarn standalone
```

# Installation from Dockerfile

## Requirements

* [Docker](https://www.docker.com/products/docker-desktop)

## Installation

If not already built (check with `docker images` command), or you want to recreate docker image from fresh sources, go 
to project directory and build image from Dockerfile, automatically named after code version.

```
> cd MyWebClient
MyWebClient> docker build -t mwiclient:$(git rev-parse --short HEAD) .
```

Run image from project directory, with port mapping and volume mount.
The path of shared folder may change whether you run docker via Docker CLI, Docker Desktop, Docker Toolbox or anything else.
Mount path defines what you'll type in application database locator, typically `/data/mwi.db`.

```
> docker run -p80:3000 --name mwiclient -v /path/to/hosted/mywi/data:/data mwiclient:<revision_tag>
```

Now, you should be able to browse application at your Docker public IP address (given your Docker configuration)

## Utils

Show running containers to know current container id

```
> docker ps
```
