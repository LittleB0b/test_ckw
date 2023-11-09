#!/bin/bash

# Script pour automatiser les tâches de dépôt git

# Utilisation du script :
# ./nom_du_script.sh [prod] nom_dépôt1 major nom_dépôt2 minor...

# Vérifier si le mode de production est activé
PROD=0
if [ "$1" = "prod" ]; then
  PROD=1
  shift  # Supprimer le premier argument, donc les suivants sont tous des noms de dépôts
fi

# Fonction pour traiter un dépôt
process_repo() {
    local repo_name="$1"
    local version_increment="$2"  # Détermine la version du tags à augmenter  (major, minor ou patch)
    local repo_path="$(pwd)/$repo_name"

    echo "Traitement du dépôt : $repo_name"

    # Se déplacer dans le dépôt Git
    cd "$repo_path" || { echo "Impossible d'accéder au répertoire $repo_name"; exit 1; }

    # Récupérer les dernières modifications
    git fetch origin

    # Obtenir les tags et déterminer le dernier tag
    last_tag=$(git describe --tags "$(git rev-list --tags --max-count=1)" 2>/dev/null)

    # Gestion des tags
    if [[ -z "$last_tag" ]]; then
        # Aucun tag n'existe, nous créons donc le tout premier tag
        new_tag="v1.0.0"
    else
        # Un tag existe, nous décomposons les parties du numéro de version
        IFS='.' read -ra VERSION_PARTS <<< "${last_tag#v}"  # Supprime le 'v' et divise
        major=${VERSION_PARTS[0]}
        minor=${VERSION_PARTS[1]}
        patch=${VERSION_PARTS[2]}

        # Incrémenter la version en fonction du paramètre fourni
        case $version_increment in
            major)
                new_tag="v$((major + 1)).0.0"
                ;;
            minor)
                new_tag="v$major.$((minor + 1)).0"
                ;;
            patch)
                new_tag="v$major.$minor.$((patch + 1))"
                ;;
            *)
                echo "Incrément de version invalide. Les valeurs autorisées sont : major, minor, patch."
                exit 1
                ;;
        esac
    fi

    if [ "$PROD" -eq 1 ]; then
        echo "Mode production activé. Application des commandes de production."

        # Fusion de prod dans master
        echo "Fusion de 'prod' dans 'master'..."
        git checkout master
        git pull origin master
        git merge origin/prod

        # Vérification des conflits de fusion
        if [ "$(git ls-files -u | wc -l)" -gt 0 ]; then
            echo "Conflits détectés lors de la fusion de 'prod' dans 'master'."
            echo "Veuillez résoudre les conflits et appuyer sur [Entrée] pour continuer."
            read -p "Après la résolution, appuyez sur [Entrée] pour continuer..."  # Pause, en attente de l'intervention de l'utilisateur
        fi

        git push origin master

        # Fusion de master dans prod
        echo "Fusion de 'master' dans 'prod'..."
        git checkout prod
        git pull origin prod
        git merge origin/master

        # Vérification des conflits de fusion
        if [ "$(git ls-files -u | wc -l)" -gt 0 ]; then
            echo "Conflits détectés lors de la fusion de 'master' dans 'prod'."
            echo "Veuillez résoudre les conflits et appuyer sur [Entrée] pour continuer."
            read -p "Après la résolution, appuyez sur [Entrée] pour continuer..."  # Pause, en attente de l'intervention de l'utilisateur
        fi

        git push origin prod

        # TODO IF CIRKWI/MODULEBOX
        if [ "$repo_name" = "modulesbox" ] || [ "$repo_name" = "cirkwi" ]
	        sh ./UpdateConstantes.sh $last_tag  $PROD
        fi

        # Création et push du nouveau tag
        git tag $new_tag
        echo "Tag créé localement: $new_tag"
        git push --tags
        echo "Nouveau tag poussé vers le dépôt distant."

        echo "Les fusions sont complètes."

    else
        echo "Mode production non activé. Affichage des informations."
        echo "Dernier tag: $last_tag"
        echo "Nouveau tag proposé: $new_tag"
    fi

    cd - > /dev/null  # Revenir au répertoire précédent
    echo ""  # Ligne vide pour la lisibilité
}

# Vérifier qu'un nombre pair d'arguments a été fourni (dépôt + type d'incrément pour chacun)
if [ $(($# % 2)) -ne 0 ]; then
    echo "Erreur: Chaque dépôt doit être suivi d'un type d'incrément de version. Ex : cirkwi major bord patch"
    exit 1
fi

# Boucle principale pour traiter tous les dépôts passés en arguments
while [ $# -gt 0 ]; do
    repo=$1
    version_increment=$2
    process_repo "$repo" "$version_increment"

    # Décaler les arguments, en traitant les deux suivants
    shift 2
done