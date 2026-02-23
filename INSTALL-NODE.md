# Installer Node.js et npm (Windows)

Si `npm` n'est pas reconnu, Node.js n'est pas installé ou pas dans le PATH.

## Option 1 : winget (recommandé)

Dans PowerShell (en dehors de Cursor si besoin) :

```powershell
winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
```

Acceptez la demande UAC (administrateur), attendez la fin, puis **fermez et rouvrez le terminal**.

## Option 2 : Site officiel

1. Allez sur **https://nodejs.org**
2. Téléchargez la version **LTS**
3. Lancez l’installateur (.msi)
4. Cochez **"Add to PATH"** si proposé
5. Redémarrez le terminal (ou Cursor)

## Vérification

```powershell
node --version   # ex. v24.x.x
npm --version   # ex. 10.x.x
```

## Ensuite

Dans le dossier du projet :

```powershell
cd c:\GIT\altered_sealed_simulator
npm install
npm run dev
```
