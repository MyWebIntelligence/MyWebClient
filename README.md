# MyWebClient : Votre outil pour MyWebIntelligence

Bienvenue sur MyWebClient ! C'est une application web qui vous aide à travailler avec les données du projet [MyWebIntelligencePython](https://github.com/MyWebIntelligence/MyWebIntelligencePython). Imaginez que c'est une interface graphique pour nettoyer, organiser et analyser des informations.

**Important :** Avant d'utiliser MyWebClient, vous devez d'abord installer MyWebIntelligencePython et l'utiliser pour créer une base de données. MyWebClient a besoin de cette base de données pour fonctionner.

L'application se compose de deux parties qui tournent en même temps :
1.  Le **client ReactJS** : C'est l'interface que vous voyez et utilisez dans votre navigateur.
2.  Le **serveur API** : C'est un petit programme en arrière-plan qui permet au client de lire et écrire dans la base de données SQLite.

## Comment installer MyWebClient ?

Vous avez deux options pour installer MyWebClient : avec Docker (plus simple si vous connaissez déjà un peu) ou directement depuis le code source.

### Option 1 : Installation avec Docker (Recommandé si vous débutez avec ce type de projet)

Docker, c'est un peu comme une boîte magique qui contient tout ce dont l'application a besoin pour fonctionner, sans avoir à installer plein de choses séparément sur votre ordinateur.

**Ce qu'il vous faut :**
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) : Installez-le si ce n'est pas déjà fait.

**Étapes d'installation :**

1.  **Téléchargez le projet :**
    Ouvrez un terminal (ou invite de commandes) et tapez :
    ```bash
    git clone https://github.com/MyWebIntelligence/MyWebClient.git
    ```
    Cela va copier tous les fichiers du projet sur votre ordinateur.

2.  **Allez dans le dossier du projet :**
    ```bash
    cd MyWebClient
    ```

3.  **Construisez l'image Docker :**
    Une "image", c'est le plan de notre boîte magique.
    ```bash
    docker build -t mwiclient:1.0 .
    ```
    (Le `.` à la fin est important, il dit à Docker de chercher les instructions dans le dossier actuel).
    Cette commande peut prendre quelques minutes la première fois.

4.  **Lancez l'application (le "conteneur" Docker) :**
    Maintenant, on crée une instance de notre boîte magique et on la démarre.
    ```bash
    docker run -p 80:3000 --name mwiclient -v /chemin/vers/vos/donnees/mywi:/data mwiclient:1.0
    ```
    Décortiquons cette commande :
    *   `-p 80:3000` : Rend l'application accessible sur le port 80 de votre ordinateur (redirigé depuis le port 3000 à l'intérieur de la boîte Docker).
    *   `--name mwiclient` : Donne un nom à notre boîte pour la retrouver facilement.
    *   `-v /chemin/vers/vos/donnees/mywi:/data` : C'est **TRÈS IMPORTANT**.
        *   Remplacez `/chemin/vers/vos/donnees/mywi` par le **chemin exact** sur VOTRE ordinateur où se trouve le dossier `Data` du projet MyWebIntelligencePython (celui qui contient le fichier `mwi.db`).
        *   Par exemple, si votre base de données `mwi.db` est dans `/Users/VotreNom/Documents/MyWebIntelligencePython/Data`, alors vous mettriez `/Users/VotreNom/Documents/MyWebIntelligencePython/Data:/data`.
        *   `/data` à la fin est le nom du dossier *à l'intérieur* de la boîte Docker. L'application MyWebClient cherchera la base de données dans `/data/mwi.db`.
    *   `mwiclient:1.0` : C'est le nom de l'image qu'on a construite.

5.  **Accédez à l'application :**
    Ouvrez votre navigateur web et allez à l'adresse `http://localhost` (ou `http://localhost:80`).

### Option 2 : Installation depuis le code source

Cette méthode vous donne plus de contrôle mais demande d'installer quelques outils.

**Ce qu'il vous faut :**
*   [Git](https://git-scm.com/downloads) : Pour télécharger le code.
*   [NodeJS](https://nodejs.org/en/download/) (version 12.16 ou une version compatible) : C'est l'environnement qui fait tourner JavaScript côté serveur.
*   [Yarn](https://classic.yarnpkg.com/en/docs/install) (version 1.22 ou une version compatible) : C'est un gestionnaire de paquets pour les projets JavaScript, un peu comme un assistant qui télécharge et gère les outils dont le projet a besoin.
*   Avoir installé et configuré [MyWebIntelligencePython](https://github.com/MyWebIntelligence/MyWebIntelligencePython) et sa base de données.

**Étapes d'installation :**

1.  **Téléchargez le projet :**
    ```bash
    git clone https://github.com/MyWebIntelligence/MyWebClient.git
    ```

2.  **Allez dans le dossier du projet :**
    ```bash
    cd MyWebClient
    ```

3.  **Installez les dépendances (les outils nécessaires) :**
    Yarn va lire un fichier de configuration et télécharger tout ce qu'il faut.
    ```bash
    yarn install
    ```
    Cela installera les dépendances pour le serveur et aussi pour la partie client (l'interface graphique).

### Démarrer l'application (si installée depuis les sources)

Une fois que tout est installé (avec l'option 2) :

1.  Assurez-vous d'être toujours dans le dossier `MyWebClient`.
2.  Lancez cette commande :
    ```bash
    yarn standalone
    ```
    Cela va démarrer à la fois le serveur API et le client ReactJS.
3.  Ouvrez votre navigateur web et allez à l'adresse `http://localhost:3000`.

## Authentification : Votre compte Administrateur

Quand vous lancez MyWebClient pour la toute première fois (que ce soit avec Docker ou depuis les sources), un compte administrateur est créé automatiquement pour vous.

*   **Identifiant par défaut :** `admin`
*   **Mot de passe :**
    *   Il est généré **aléatoirement** (c'est une suite de caractères un peu compliquée).
    *   Vous le trouverez affiché dans la **console** (le terminal où vous avez lancé la commande `docker run` ou `yarn standalone`).
    *   Il est aussi sauvegardé dans un fichier nommé `admin_password.txt` qui se trouve à la racine du dossier `MyWebClient`.

**Comment choisir votre propre mot de passe administrateur ?**

Si vous ne voulez pas du mot de passe aléatoire, vous pouvez le définir vous-même AVANT de lancer l'application pour la première fois.

*   **Avec Docker :**
    Ajoutez `-e ADMIN_PASSWORD=VotreSuperMotDePasse` à la commande `docker run`.
    Exemple :
    ```bash
    docker run -p 80:3000 --name mwiclient -v /chemin/vers/vos/donnees/mywi:/data -e ADMIN_PASSWORD=MonMotDePasseSecret mwiclient:1.0
    ```

*   **Depuis les sources (avec `yarn standalone`) :**
    Définissez la variable d'environnement `ADMIN_PASSWORD` avant de lancer la commande.
    Exemple (sur Linux/macOS) :
    ```bash
    ADMIN_PASSWORD=MonMotDePasseSecret yarn standalone
    ```
    Exemple (sur Windows avec PowerShell) :
    ```powershell
    $env:ADMIN_PASSWORD="MonMotDePasseSecret"; yarn standalone
    ```
    Ou, vous pouvez aussi passer le mot de passe directement au script qui initialise l'administrateur (c'est un peu plus technique) :
    ```bash
    node server/src/initAdmin.js MonMotDePasseSecret
    ```
    Puis lancez `yarn standalone`.

**Important :** Si un compte admin existe déjà, ces méthodes pour définir le mot de passe ne fonctionneront pas. Elles servent uniquement lors de la *création* du premier compte.

## Commandes Docker utiles

*   **Voir les conteneurs Docker qui tournent :**
    Utile pour connaître l'ID de votre conteneur `mwiclient` s'il est en cours d'exécution.
    ```bash
    docker ps
    ```
*   **Arrêter le conteneur :**
    ```bash
    docker stop mwiclient
    ```
*   **Redémarrer un conteneur arrêté :**
    ```bash
    docker start mwiclient
    ```
*   **Voir les logs (messages) du conteneur :**
    Si quelque chose ne va pas, les messages d'erreur sont souvent ici.
    ```bash
    docker logs mwiclient
    ```

C'est tout ! Vous devriez maintenant être capable d'installer et de lancer MyWebClient. N'hésitez pas à relire attentivement les étapes, surtout celle concernant le chemin vers vos données (`-v /chemin/vers/vos/donnees/mywi:/data`) car c'est une source fréquente de petits soucis au début.
