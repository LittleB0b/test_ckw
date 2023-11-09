#!/bin/bash

# $1 est le dernier tag
# $2 est le mode prod
# $3 est le nom du repo

FILE_PATH="app/config/constantes.php"

# Récupérer le dernier tag
last_tag=$1

# Liste les fichiers CSS modifiés entre le dernier tag et le HEAD actuel
css_changes=$(git log --name-only --oneline $last_tag..HEAD | grep '\.css$' | sort | uniq)

# Si des fichiers CSS ont été modifiés
if [[ ! -z "$css_changes" ]]; then
    echo "Fichiers css modifiés, augmentation des constantes"
    # Extraire le numéro actuel de la version CSS
    current_version=$(grep "VERSION_CSS" $FILE_PATH | grep -oE "\d+")
    
    # Incrémenter la version
    new_version=$((current_version + 1))

		if [[ $2 -eq 1]]; then
	    # Mettre à jour le fichier avec la nouvelle version
	    sed -i "" "s/'VERSION_CSS' =>  constant(\"ENV\") == \"prod\" ? $current_version : time()/'VERSION_CSS' =>  constant(\"ENV\") == \"prod\" ? $new_version : time()/g" $FILE_PATH
		else
	    echo "[DEBUG] Mise à jour de la constante VERSION_CSS avec la nouvelle version : $new_version"
		fi	

else
		if [[ $2 -eq 1]]; then
	    echo "Aucun css modifié..."
		else
			echo "[DEBUG] Aucun css modifié..."
		fi	
fi

js_changes=$(git log --name-only --oneline $last_tag..HEAD | grep '\.js$' | sort | uniq)


# Si des fichiers CSS ont été modifiés
if [[ ! -z "$js_changes" ]]; then
    echo "Fichiers js modifiés, augmentation des constantes"
    # Extraire le numéro actuel de la version JS
    current_version_js=$(grep "'VERSION_JS'" $FILE_PATH | grep -oE "\d+")
    echo $current_version_js
    new_version_js=$((current_version_js + 1))
    echo $new_version_js

		if [[ $2 -eq 1]]; then
	    sed -i "" "s/'VERSION_JS' =>  constant(\"ENV\") == \"prod\" ? $current_version_js : time()/'VERSION_JS' =>  constant(\"ENV\") == \"prod\" ? $new_version_js : time()/g" $FILE_PATH
		else
	    echo "[DEBUG] Mise à jour de la constante VERSION_JS avec la nouvelle version : $new_version_js"
		fi	

		if [[ $3 -eq "cirkwi"]]; then
		    echo "--"
		    # Extraire le numéro actuel de la version VERSION_JS_BACK
		    current_version_js=$(grep "VERSION_JS_BACK" $FILE_PATH | grep -oE "\d+")
		    echo $current_version_js
		    new_version_js=$((current_version_js + 1))
		    echo $new_version_js
		
				if [[ $2 -eq 1]]; then
			    sed -i "" "s/'VERSION_JS_BACK' => constant(\"ENV\") == \"prod\" ? $current_version_js : time()/'VERSION_JS_BACK' => constant(\"ENV\") == \"prod\" ? $new_version_js : time()/g" $FILE_PATH
				else
			    echo "[DEBUG] Mise à jour de la constante VERSION_JS_BACK avec la nouvelle version : $new_version_js"
				fi	
		    # Extraire le numéro actuel de la version VERSION_JS_FRONT
		    current_version_js=$(grep "VERSION_JS_FRONT" $FILE_PATH | grep -oE "\d+")
		    new_version_js=$((current_version_js + 1))
				if [[ $2 -eq 1]]; then
			    sed -i "" "s/'VERSION_JS_FRONT' => constant(\"ENV\") == \"prod\" ? $current_version_js : time()/'VERSION_JS_FRONT' => constant(\"ENV\") == \"prod\" ? $new_version_js : time()/g" $FILE_PATH
				else
			    echo "[DEBUG] Mise à jour de la constante VERSION_JS_FRONT avec la nouvelle version : $new_version_js"
				fi	
		fi
else
    echo "Aucun js modifié..."
fi

if [[ $2 -eq 1]]; then
git add .
git commit -m "[MEP] Augmentation des constantes"
git push