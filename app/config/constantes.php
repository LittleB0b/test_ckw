<?php
use Cirkwi\Tools\Constantes;

/* ---------------------------- */
/* -------- CONSTANTES -------- */
/* ---------------------------- */
$constantes = new Constantes(
    [
        // Constantes utiles pour les chemins d'accés
        'DIR'   => __DIR__ . '/../../',
        'BASE_DIRECTORY_PROJECT'   => __DIR__ . '/../../',
        'REPERTOIRE_FICHIER'    => __DIR__ . '/../../../fichier/',
        'BASE_DIRECTORY_PROJECT_CIRKWI'   => __DIR__ . '/../../',
        'PDF_DIRECTORY' => __DIR__ . '/../../../fichier/pdf/',
        'BASE_URL' => 'https://' . $_SERVER['HTTP_HOST'] . '/cirkwi/',
        'SITE' => 'www.cirkwi.com',
        'BASEURL_PRO_CIRKWI' => 'https://pro.cirkwi.com',   //L'adresse de pro.cirkwi utilisé dans les mails pour ne plus afficher Modulebox

        'DOSSIER_TMP' => __DIR__ . '/../../web/fichier/tmp/',

        // Constantes de version
        'JQUERY_VERSION' => '1.11.2',
        'JQUERY_VALIDATE_VERSION' => '1.13.1',
        'JQUERY_STATISTICS_VERSION'=> '3.3.1',
        'BOOTSTRAP_VERSION' => '4.4.1',
        'SYSTEME_ROUTING' => 'PHP',
        'VERSION' => 'prod',
        'MAINTENANCE' => false,

        // Constantes de cache
        'CACHE_ACTIF' => true,
        'APC_ACTIF' => function_exists('apcu_exists'),
        'APC_CLEAR' => false,

        // Constantes relatives à l'API Commentaire
        'ID_PLATEFORME' => 1,
        'HOTE_API_COMMENTAIRE' => IP_COMMENTAIRE,

        // Nécessaire pour afficher les commentaires sous les vignettes
        'AFFICHER_STICKER' => true,
        'LIMITE_COMMENTAIRE' => '2',
        'LIMITE_PHOTOS' => '5',
        'DELAI_CACHE_COMMENTAIRE' => 604800, // 7 jours (en secondes)

        // Constantes relatives au profilage
        'NOTIFICATIONS_ENABLED' => true,
        'RATIO_MIN_ACTIVITES' => 30, // à partir de 25% d'intérêt, une activité est enregistrée
        'RATIO_MIN_NOTIFICATIONS' => 60, // à partir de 50 % d'intérêt, une notification est créée
        'RATIO_MIN_MAIL' => 90, // à partir de 75 % d'intérêt, un mail est envoyé
        'DELAI_INTERET' => 1296000, // 15 jours
        //'METHODE_PERTE_INTERET' => 'lineaire', // lineaire | relatif @TODO
        'NOTIFS_ACTIF_POUR' => 'ROLE_USER', // Détermine quels utilisateurs reçoivent des notifications
        'DELAI_RAPPEL_NOTIFICATIONS' => 7, // Si une notification n'est pas lue au bout de 7 jours, un rappel par mail est envoyé
        'DELAI_MAIL_HEBDOMADAIRE' => 7, // Délai entre 2 mails hebdomadaires (jours)
        'DELAI_MAIL_NOUVEAU_MESSAGE' => 30 , // Délai avant d'envoyer un mail de nouveau message (minutes)

        // Constantes de cache
        'DELAI_CACHE_AVATAR' => 1296000, // 15 jours

        // Autres constantes
        'IP_CIRKWI' => '78.230.73.65',
        'MODE_CLI' => PHP_SAPI === 'cli', // Si l'application est lancée depuis la console
        'DELAI_NOTIFICATIONS' => 60000, // en millisecondes
        'TIMEOUT_NOTIFICATIONS' => 5000, // temps maximum pour la requête en millisecondes
        'DEFAULT_ERREUR_DEV' => 'Ton application chie dans la colle',
        'VERSION_CSS' =>  constant("ENV") == "prod" ? 580 : time(),
        'VERSION_JS' =>  constant("ENV") == "prod" ? 579 : time(), // Permet de recharger le fichier javascript sans vider le cache
        'VERSION_JS_BACK' => constant("ENV") == "prod" ? 560 : time(), //Permet de forcer les js en cache du client
        'VERSION_JS_FRONT' => constant("ENV") == "prod" ? 560 : time(), //Permet de forcer les js en cache du client
        'MAIL_NOREPLY' => 'no-reply@cirkwi.com',
        'MAIL_NOREPLY_FFR' => 'noreply@ffrandonnee.fr',
		'MAIL_DELETE_ACCOUNT' => 'support@cirkwi.com',
        'USE_SOLR' => class_exists('SolrClient'),
        'RECAPTCHA_VERIFY' => 'https://www.google.com/recaptcha/api/siteverify?secret=', // URL check google recaptcha
        'LAST_CGU_DATE' => 1527199200, // Date de la dernière version de CGU (25 mai 2018 0:00)
        'AUTHORIZED_PAGES_GTU_NOT_ACCEPTED' => 'acceptCGU|acceptCGUPost|allerCGU|changerLangue|logout|getHeader|kwapObtenirInfoUser|kwapObtenirInfoUserPost|isUsedLoggedIn',

        // STORYGUIDES
        'STORYGUIDES_ACTIVE' => false, // Est-ce qu'on affiche les stories ?
        'STORYGUIDES_DELAY' => 2000, // Nombre de ms avant d'afficher les objets WIM

        // SENDINBLUE
        'SENDINBLUE_ACTIVE' =>true,

        //applications mobiles
        'URL_PORTAIL_CIRKWI' => DOMAINE_CIRKWI,
        'URL_APP_CIRKWI_IOS' => 'https://geo.itunes.apple.com/fr/app/cirkwi/id651471914?mt=8&uo=6',
        'URL_APP_CIRKWI_ANDROID' => 'https://play.google.com/store/apps/details?id=com.cirkwi.pit',
        'URL_CIRKWI_UNIVERSAL_LINK' => UNIVERSAL_LINKS_ORIGIN . '/com.cirkwi.pit/%s/%s?',

        //couleur imposée selon le mode ENV
        'COLOR_QA' => '#e71583',

        //Google ad
        "GOOGLE_AD_ID" => "ca-pub-7701178765491334",

        // HOTJAR
        "HOTJAR_ACTIVE" => true,

        // Constantes de cas particuliers
        'LIST_ID_USER_WITH_PDF_CHOICE' => json_encode([88199]), // Sarthe Tourisme

        // Suivis
        "DISPLAY_FOLLOW_FEATURE" => false,

        // CIRKWI MAG
        "ENABLED_CIRKWI_MAG" => false,
        "CIRKWI_MAG_CSS_URL" => "https://un.cirkwi.com/demo/CirkwiMagWidget/widget.css",
        "CIRKWI_MAG_JS_URL" => "https://un.cirkwi.com/demo/CirkwiMagWidget/widget.js"
    ]
);

// @todo On ne peux pas mettre d'array dans les constantes en 5.6, alors on fait comme ca pour l'instant, à changer si on passe à une version supérieure

/**
 * Retourne la liste des utilisateurs qui ne doivent pas avoir de pubs affichés sur leurs objets ou dans la recherche
 * @return array<int>
 */
function getNoPubUsers() {
    $noPubUsers = [
        15010,  // Tourisme 61 - Conseil départemental de l'Orne
        96572,  // Moselle Attractivité
        14875   // Rouen Métropole
    ];

    return $noPubUsers;
}
