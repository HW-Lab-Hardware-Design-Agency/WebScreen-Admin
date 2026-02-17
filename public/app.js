// Timezone data: [IANA name, POSIX TZ string]
// Source: https://github.com/nayarsystems/posix_tz_db/blob/master/zones.csv
const TIMEZONE_DATA = [
    ["Africa/Abidjan","GMT0"],
    ["Africa/Accra","GMT0"],
    ["Africa/Addis_Ababa","EAT-3"],
    ["Africa/Algiers","CET-1"],
    ["Africa/Asmara","EAT-3"],
    ["Africa/Bamako","GMT0"],
    ["Africa/Bangui","WAT-1"],
    ["Africa/Banjul","GMT0"],
    ["Africa/Bissau","GMT0"],
    ["Africa/Blantyre","CAT-2"],
    ["Africa/Brazzaville","WAT-1"],
    ["Africa/Bujumbura","CAT-2"],
    ["Africa/Cairo","EET-2EEST,M4.5.5/0,M10.5.4/24"],
    ["Africa/Casablanca","<+01>-1"],
    ["Africa/Ceuta","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Africa/Conakry","GMT0"],
    ["Africa/Dakar","GMT0"],
    ["Africa/Dar_es_Salaam","EAT-3"],
    ["Africa/Djibouti","EAT-3"],
    ["Africa/Douala","WAT-1"],
    ["Africa/El_Aaiun","<+01>-1"],
    ["Africa/Freetown","GMT0"],
    ["Africa/Gaborone","CAT-2"],
    ["Africa/Harare","CAT-2"],
    ["Africa/Johannesburg","SAST-2"],
    ["Africa/Juba","CAT-2"],
    ["Africa/Kampala","EAT-3"],
    ["Africa/Khartoum","CAT-2"],
    ["Africa/Kigali","CAT-2"],
    ["Africa/Kinshasa","WAT-1"],
    ["Africa/Lagos","WAT-1"],
    ["Africa/Libreville","WAT-1"],
    ["Africa/Lome","GMT0"],
    ["Africa/Luanda","WAT-1"],
    ["Africa/Lubumbashi","CAT-2"],
    ["Africa/Lusaka","CAT-2"],
    ["Africa/Malabo","WAT-1"],
    ["Africa/Maputo","CAT-2"],
    ["Africa/Maseru","SAST-2"],
    ["Africa/Mbabane","SAST-2"],
    ["Africa/Mogadishu","EAT-3"],
    ["Africa/Monrovia","GMT0"],
    ["Africa/Nairobi","EAT-3"],
    ["Africa/Ndjamena","WAT-1"],
    ["Africa/Niamey","WAT-1"],
    ["Africa/Nouakchott","GMT0"],
    ["Africa/Ouagadougou","GMT0"],
    ["Africa/Porto-Novo","WAT-1"],
    ["Africa/Sao_Tome","GMT0"],
    ["Africa/Tripoli","EET-2"],
    ["Africa/Tunis","CET-1"],
    ["Africa/Windhoek","CAT-2"],
    ["America/Adak","HST10HDT,M3.2.0,M11.1.0"],
    ["America/Anchorage","AKST9AKDT,M3.2.0,M11.1.0"],
    ["America/Anguilla","AST4"],
    ["America/Antigua","AST4"],
    ["America/Araguaina","<-03>3"],
    ["America/Argentina/Buenos_Aires","<-03>3"],
    ["America/Argentina/Catamarca","<-03>3"],
    ["America/Argentina/Cordoba","<-03>3"],
    ["America/Argentina/Jujuy","<-03>3"],
    ["America/Argentina/La_Rioja","<-03>3"],
    ["America/Argentina/Mendoza","<-03>3"],
    ["America/Argentina/Rio_Gallegos","<-03>3"],
    ["America/Argentina/Salta","<-03>3"],
    ["America/Argentina/San_Juan","<-03>3"],
    ["America/Argentina/San_Luis","<-03>3"],
    ["America/Argentina/Tucuman","<-03>3"],
    ["America/Argentina/Ushuaia","<-03>3"],
    ["America/Aruba","AST4"],
    ["America/Asuncion","<-03>3"],
    ["America/Atikokan","EST5"],
    ["America/Bahia","<-03>3"],
    ["America/Bahia_Banderas","CST6"],
    ["America/Barbados","AST4"],
    ["America/Belem","<-03>3"],
    ["America/Belize","CST6"],
    ["America/Blanc-Sablon","AST4"],
    ["America/Boa_Vista","<-04>4"],
    ["America/Bogota","<-05>5"],
    ["America/Boise","MST7MDT,M3.2.0,M11.1.0"],
    ["America/Cambridge_Bay","MST7MDT,M3.2.0,M11.1.0"],
    ["America/Campo_Grande","<-04>4"],
    ["America/Cancun","EST5"],
    ["America/Caracas","<-04>4"],
    ["America/Cayenne","<-03>3"],
    ["America/Cayman","EST5"],
    ["America/Chicago","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Chihuahua","CST6"],
    ["America/Costa_Rica","CST6"],
    ["America/Creston","MST7"],
    ["America/Cuiaba","<-04>4"],
    ["America/Curacao","AST4"],
    ["America/Danmarkshavn","GMT0"],
    ["America/Dawson","MST7"],
    ["America/Dawson_Creek","MST7"],
    ["America/Denver","MST7MDT,M3.2.0,M11.1.0"],
    ["America/Detroit","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Dominica","AST4"],
    ["America/Edmonton","MST7MDT,M3.2.0,M11.1.0"],
    ["America/Eirunepe","<-05>5"],
    ["America/El_Salvador","CST6"],
    ["America/Fortaleza","<-03>3"],
    ["America/Fort_Nelson","MST7"],
    ["America/Glace_Bay","AST4ADT,M3.2.0,M11.1.0"],
    ["America/Godthab","<-02>2<-01>,M3.5.0/-1,M10.5.0/0"],
    ["America/Goose_Bay","AST4ADT,M3.2.0,M11.1.0"],
    ["America/Grand_Turk","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Grenada","AST4"],
    ["America/Guadeloupe","AST4"],
    ["America/Guatemala","CST6"],
    ["America/Guayaquil","<-05>5"],
    ["America/Guyana","<-04>4"],
    ["America/Halifax","AST4ADT,M3.2.0,M11.1.0"],
    ["America/Havana","CST5CDT,M3.2.0/0,M11.1.0/1"],
    ["America/Hermosillo","MST7"],
    ["America/Indiana/Indianapolis","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Indiana/Knox","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Indiana/Marengo","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Indiana/Petersburg","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Indiana/Tell_City","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Indiana/Vevay","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Indiana/Vincennes","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Indiana/Winamac","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Inuvik","MST7MDT,M3.2.0,M11.1.0"],
    ["America/Iqaluit","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Jamaica","EST5"],
    ["America/Juneau","AKST9AKDT,M3.2.0,M11.1.0"],
    ["America/Kentucky/Louisville","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Kentucky/Monticello","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Kralendijk","AST4"],
    ["America/La_Paz","<-04>4"],
    ["America/Lima","<-05>5"],
    ["America/Los_Angeles","PST8PDT,M3.2.0,M11.1.0"],
    ["America/Lower_Princes","AST4"],
    ["America/Maceio","<-03>3"],
    ["America/Managua","CST6"],
    ["America/Manaus","<-04>4"],
    ["America/Marigot","AST4"],
    ["America/Martinique","AST4"],
    ["America/Matamoros","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Mazatlan","MST7"],
    ["America/Menominee","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Merida","CST6"],
    ["America/Metlakatla","AKST9AKDT,M3.2.0,M11.1.0"],
    ["America/Mexico_City","CST6"],
    ["America/Miquelon","<-03>3<-02>,M3.2.0,M11.1.0"],
    ["America/Moncton","AST4ADT,M3.2.0,M11.1.0"],
    ["America/Monterrey","CST6"],
    ["America/Montevideo","<-03>3"],
    ["America/Montreal","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Montserrat","AST4"],
    ["America/Nassau","EST5EDT,M3.2.0,M11.1.0"],
    ["America/New_York","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Nipigon","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Nome","AKST9AKDT,M3.2.0,M11.1.0"],
    ["America/Noronha","<-02>2"],
    ["America/North_Dakota/Beulah","CST6CDT,M3.2.0,M11.1.0"],
    ["America/North_Dakota/Center","CST6CDT,M3.2.0,M11.1.0"],
    ["America/North_Dakota/New_Salem","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Nuuk","<-02>2<-01>,M3.5.0/-1,M10.5.0/0"],
    ["America/Ojinaga","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Panama","EST5"],
    ["America/Pangnirtung","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Paramaribo","<-03>3"],
    ["America/Phoenix","MST7"],
    ["America/Port-au-Prince","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Port_of_Spain","AST4"],
    ["America/Porto_Velho","<-04>4"],
    ["America/Puerto_Rico","AST4"],
    ["America/Punta_Arenas","<-03>3"],
    ["America/Rainy_River","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Rankin_Inlet","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Recife","<-03>3"],
    ["America/Regina","CST6"],
    ["America/Resolute","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Rio_Branco","<-05>5"],
    ["America/Santarem","<-03>3"],
    ["America/Santiago","<-04>4<-03>,M9.1.6/24,M4.1.6/24"],
    ["America/Santo_Domingo","AST4"],
    ["America/Sao_Paulo","<-03>3"],
    ["America/Scoresbysund","<-02>2<-01>,M3.5.0/-1,M10.5.0/0"],
    ["America/Sitka","AKST9AKDT,M3.2.0,M11.1.0"],
    ["America/St_Barthelemy","AST4"],
    ["America/St_Johns","NST3:30NDT,M3.2.0,M11.1.0"],
    ["America/St_Kitts","AST4"],
    ["America/St_Lucia","AST4"],
    ["America/St_Thomas","AST4"],
    ["America/St_Vincent","AST4"],
    ["America/Swift_Current","CST6"],
    ["America/Tegucigalpa","CST6"],
    ["America/Thule","AST4ADT,M3.2.0,M11.1.0"],
    ["America/Thunder_Bay","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Tijuana","PST8PDT,M3.2.0,M11.1.0"],
    ["America/Toronto","EST5EDT,M3.2.0,M11.1.0"],
    ["America/Tortola","AST4"],
    ["America/Vancouver","PST8PDT,M3.2.0,M11.1.0"],
    ["America/Whitehorse","MST7"],
    ["America/Winnipeg","CST6CDT,M3.2.0,M11.1.0"],
    ["America/Yakutat","AKST9AKDT,M3.2.0,M11.1.0"],
    ["America/Yellowknife","MST7MDT,M3.2.0,M11.1.0"],
    ["Antarctica/Casey","<+08>-8"],
    ["Antarctica/Davis","<+07>-7"],
    ["Antarctica/DumontDUrville","<+10>-10"],
    ["Antarctica/Macquarie","AEST-10AEDT,M10.1.0,M4.1.0/3"],
    ["Antarctica/Mawson","<+05>-5"],
    ["Antarctica/McMurdo","NZST-12NZDT,M9.5.0,M4.1.0/3"],
    ["Antarctica/Palmer","<-03>3"],
    ["Antarctica/Rothera","<-03>3"],
    ["Antarctica/Syowa","<+03>-3"],
    ["Antarctica/Troll","<+00>0<+02>-2,M3.5.0/1,M10.5.0/3"],
    ["Antarctica/Vostok","<+05>-5"],
    ["Arctic/Longyearbyen","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Asia/Aden","<+03>-3"],
    ["Asia/Almaty","<+05>-5"],
    ["Asia/Amman","<+03>-3"],
    ["Asia/Anadyr","<+12>-12"],
    ["Asia/Aqtau","<+05>-5"],
    ["Asia/Aqtobe","<+05>-5"],
    ["Asia/Ashgabat","<+05>-5"],
    ["Asia/Atyrau","<+05>-5"],
    ["Asia/Baghdad","<+03>-3"],
    ["Asia/Bahrain","<+03>-3"],
    ["Asia/Baku","<+04>-4"],
    ["Asia/Bangkok","<+07>-7"],
    ["Asia/Barnaul","<+07>-7"],
    ["Asia/Beirut","EET-2EEST,M3.5.0/0,M10.5.0/0"],
    ["Asia/Bishkek","<+06>-6"],
    ["Asia/Brunei","<+08>-8"],
    ["Asia/Chita","<+09>-9"],
    ["Asia/Choibalsan","<+08>-8"],
    ["Asia/Colombo","<+0530>-5:30"],
    ["Asia/Damascus","<+03>-3"],
    ["Asia/Dhaka","<+06>-6"],
    ["Asia/Dili","<+09>-9"],
    ["Asia/Dubai","<+04>-4"],
    ["Asia/Dushanbe","<+05>-5"],
    ["Asia/Famagusta","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Asia/Gaza","EET-2EEST,M3.4.4/50,M10.4.4/50"],
    ["Asia/Hebron","EET-2EEST,M3.4.4/50,M10.4.4/50"],
    ["Asia/Ho_Chi_Minh","<+07>-7"],
    ["Asia/Hong_Kong","HKT-8"],
    ["Asia/Hovd","<+07>-7"],
    ["Asia/Irkutsk","<+08>-8"],
    ["Asia/Jakarta","WIB-7"],
    ["Asia/Jayapura","WIT-9"],
    ["Asia/Jerusalem","IST-2IDT,M3.4.4/26,M10.5.0"],
    ["Asia/Kabul","<+0430>-4:30"],
    ["Asia/Kamchatka","<+12>-12"],
    ["Asia/Karachi","PKT-5"],
    ["Asia/Kathmandu","<+0545>-5:45"],
    ["Asia/Khandyga","<+09>-9"],
    ["Asia/Kolkata","IST-5:30"],
    ["Asia/Krasnoyarsk","<+07>-7"],
    ["Asia/Kuala_Lumpur","<+08>-8"],
    ["Asia/Kuching","<+08>-8"],
    ["Asia/Kuwait","<+03>-3"],
    ["Asia/Macau","CST-8"],
    ["Asia/Magadan","<+11>-11"],
    ["Asia/Makassar","WITA-8"],
    ["Asia/Manila","PST-8"],
    ["Asia/Muscat","<+04>-4"],
    ["Asia/Nicosia","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Asia/Novokuznetsk","<+07>-7"],
    ["Asia/Novosibirsk","<+07>-7"],
    ["Asia/Omsk","<+06>-6"],
    ["Asia/Oral","<+05>-5"],
    ["Asia/Phnom_Penh","<+07>-7"],
    ["Asia/Pontianak","WIB-7"],
    ["Asia/Pyongyang","KST-9"],
    ["Asia/Qatar","<+03>-3"],
    ["Asia/Qyzylorda","<+05>-5"],
    ["Asia/Riyadh","<+03>-3"],
    ["Asia/Sakhalin","<+11>-11"],
    ["Asia/Samarkand","<+05>-5"],
    ["Asia/Seoul","KST-9"],
    ["Asia/Shanghai","CST-8"],
    ["Asia/Singapore","<+08>-8"],
    ["Asia/Srednekolymsk","<+11>-11"],
    ["Asia/Taipei","CST-8"],
    ["Asia/Tashkent","<+05>-5"],
    ["Asia/Tbilisi","<+04>-4"],
    ["Asia/Tehran","<+0330>-3:30"],
    ["Asia/Thimphu","<+06>-6"],
    ["Asia/Tokyo","JST-9"],
    ["Asia/Tomsk","<+07>-7"],
    ["Asia/Ulaanbaatar","<+08>-8"],
    ["Asia/Urumqi","<+06>-6"],
    ["Asia/Ust-Nera","<+10>-10"],
    ["Asia/Vientiane","<+07>-7"],
    ["Asia/Vladivostok","<+10>-10"],
    ["Asia/Yakutsk","<+09>-9"],
    ["Asia/Yangon","<+0630>-6:30"],
    ["Asia/Yekaterinburg","<+05>-5"],
    ["Asia/Yerevan","<+04>-4"],
    ["Atlantic/Azores","<-01>1<+00>,M3.5.0/0,M10.5.0/1"],
    ["Atlantic/Bermuda","AST4ADT,M3.2.0,M11.1.0"],
    ["Atlantic/Canary","WET0WEST,M3.5.0/1,M10.5.0"],
    ["Atlantic/Cape_Verde","<-01>1"],
    ["Atlantic/Faroe","WET0WEST,M3.5.0/1,M10.5.0"],
    ["Atlantic/Madeira","WET0WEST,M3.5.0/1,M10.5.0"],
    ["Atlantic/Reykjavik","GMT0"],
    ["Atlantic/South_Georgia","<-02>2"],
    ["Atlantic/Stanley","<-03>3"],
    ["Atlantic/St_Helena","GMT0"],
    ["Australia/Adelaide","ACST-9:30ACDT,M10.1.0,M4.1.0/3"],
    ["Australia/Brisbane","AEST-10"],
    ["Australia/Broken_Hill","ACST-9:30ACDT,M10.1.0,M4.1.0/3"],
    ["Australia/Currie","AEST-10AEDT,M10.1.0,M4.1.0/3"],
    ["Australia/Darwin","ACST-9:30"],
    ["Australia/Eucla","<+0845>-8:45"],
    ["Australia/Hobart","AEST-10AEDT,M10.1.0,M4.1.0/3"],
    ["Australia/Lindeman","AEST-10"],
    ["Australia/Lord_Howe","<+1030>-10:30<+11>-11,M10.1.0,M4.1.0"],
    ["Australia/Melbourne","AEST-10AEDT,M10.1.0,M4.1.0/3"],
    ["Australia/Perth","AWST-8"],
    ["Australia/Sydney","AEST-10AEDT,M10.1.0,M4.1.0/3"],
    ["Europe/Amsterdam","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Andorra","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Astrakhan","<+04>-4"],
    ["Europe/Athens","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Belgrade","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Berlin","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Bratislava","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Brussels","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Bucharest","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Budapest","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Busingen","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Chisinau","EET-2EEST,M3.5.0,M10.5.0/3"],
    ["Europe/Copenhagen","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Dublin","IST-1GMT0,M10.5.0,M3.5.0/1"],
    ["Europe/Gibraltar","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Guernsey","GMT0BST,M3.5.0/1,M10.5.0"],
    ["Europe/Helsinki","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Isle_of_Man","GMT0BST,M3.5.0/1,M10.5.0"],
    ["Europe/Istanbul","<+03>-3"],
    ["Europe/Jersey","GMT0BST,M3.5.0/1,M10.5.0"],
    ["Europe/Kaliningrad","EET-2"],
    ["Europe/Kiev","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Kirov","MSK-3"],
    ["Europe/Lisbon","WET0WEST,M3.5.0/1,M10.5.0"],
    ["Europe/Ljubljana","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/London","GMT0BST,M3.5.0/1,M10.5.0"],
    ["Europe/Luxembourg","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Madrid","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Malta","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Mariehamn","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Minsk","<+03>-3"],
    ["Europe/Monaco","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Moscow","MSK-3"],
    ["Europe/Oslo","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Paris","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Podgorica","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Prague","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Riga","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Rome","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Samara","<+04>-4"],
    ["Europe/San_Marino","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Sarajevo","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Saratov","<+04>-4"],
    ["Europe/Simferopol","MSK-3"],
    ["Europe/Skopje","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Sofia","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Stockholm","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Tallinn","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Tirane","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Ulyanovsk","<+04>-4"],
    ["Europe/Uzhgorod","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Vaduz","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Vatican","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Vienna","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Vilnius","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Volgograd","MSK-3"],
    ["Europe/Warsaw","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Zagreb","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Europe/Zaporozhye","EET-2EEST,M3.5.0/3,M10.5.0/4"],
    ["Europe/Zurich","CET-1CEST,M3.5.0,M10.5.0/3"],
    ["Indian/Antananarivo","EAT-3"],
    ["Indian/Chagos","<+06>-6"],
    ["Indian/Christmas","<+07>-7"],
    ["Indian/Cocos","<+0630>-6:30"],
    ["Indian/Comoro","EAT-3"],
    ["Indian/Kerguelen","<+05>-5"],
    ["Indian/Mahe","<+04>-4"],
    ["Indian/Maldives","<+05>-5"],
    ["Indian/Mauritius","<+04>-4"],
    ["Indian/Mayotte","EAT-3"],
    ["Indian/Reunion","<+04>-4"],
    ["Pacific/Apia","<+13>-13"],
    ["Pacific/Auckland","NZST-12NZDT,M9.5.0,M4.1.0/3"],
    ["Pacific/Bougainville","<+11>-11"],
    ["Pacific/Chatham","<+1245>-12:45<+1345>,M9.5.0/2:45,M4.1.0/3:45"],
    ["Pacific/Chuuk","<+10>-10"],
    ["Pacific/Easter","<-06>6<-05>,M9.1.6/22,M4.1.6/22"],
    ["Pacific/Efate","<+11>-11"],
    ["Pacific/Enderbury","<+13>-13"],
    ["Pacific/Fakaofo","<+13>-13"],
    ["Pacific/Fiji","<+12>-12"],
    ["Pacific/Funafuti","<+12>-12"],
    ["Pacific/Galapagos","<-06>6"],
    ["Pacific/Gambier","<-09>9"],
    ["Pacific/Guadalcanal","<+11>-11"],
    ["Pacific/Guam","ChST-10"],
    ["Pacific/Honolulu","HST10"],
    ["Pacific/Kiritimati","<+14>-14"],
    ["Pacific/Kosrae","<+11>-11"],
    ["Pacific/Kwajalein","<+12>-12"],
    ["Pacific/Majuro","<+12>-12"],
    ["Pacific/Marquesas","<-0930>9:30"],
    ["Pacific/Midway","SST11"],
    ["Pacific/Nauru","<+12>-12"],
    ["Pacific/Niue","<-11>11"],
    ["Pacific/Norfolk","<+11>-11<+12>,M10.1.0,M4.1.0/3"],
    ["Pacific/Noumea","<+11>-11"],
    ["Pacific/Pago_Pago","SST11"],
    ["Pacific/Palau","<+09>-9"],
    ["Pacific/Pitcairn","<-08>8"],
    ["Pacific/Pohnpei","<+11>-11"],
    ["Pacific/Port_Moresby","<+10>-10"],
    ["Pacific/Rarotonga","<-10>10"],
    ["Pacific/Saipan","ChST-10"],
    ["Pacific/Tahiti","<-10>10"],
    ["Pacific/Tarawa","<+12>-12"],
    ["Pacific/Tongatapu","<+13>-13"],
    ["Pacific/Wake","<+12>-12"],
    ["Pacific/Wallis","<+12>-12"],
    ["Etc/GMT","GMT0"],
    ["Etc/GMT-0","GMT0"],
    ["Etc/GMT-1","<+01>-1"],
    ["Etc/GMT-2","<+02>-2"],
    ["Etc/GMT-3","<+03>-3"],
    ["Etc/GMT-4","<+04>-4"],
    ["Etc/GMT-5","<+05>-5"],
    ["Etc/GMT-6","<+06>-6"],
    ["Etc/GMT-7","<+07>-7"],
    ["Etc/GMT-8","<+08>-8"],
    ["Etc/GMT-9","<+09>-9"],
    ["Etc/GMT-10","<+10>-10"],
    ["Etc/GMT-11","<+11>-11"],
    ["Etc/GMT-12","<+12>-12"],
    ["Etc/GMT-13","<+13>-13"],
    ["Etc/GMT-14","<+14>-14"],
    ["Etc/GMT0","GMT0"],
    ["Etc/GMT+0","GMT0"],
    ["Etc/GMT+1","<-01>1"],
    ["Etc/GMT+2","<-02>2"],
    ["Etc/GMT+3","<-03>3"],
    ["Etc/GMT+4","<-04>4"],
    ["Etc/GMT+5","<-05>5"],
    ["Etc/GMT+6","<-06>6"],
    ["Etc/GMT+7","<-07>7"],
    ["Etc/GMT+8","<-08>8"],
    ["Etc/GMT+9","<-09>9"],
    ["Etc/GMT+10","<-10>10"],
    ["Etc/GMT+11","<-11>11"],
    ["Etc/GMT+12","<-12>12"],
    ["Etc/UCT","UTC0"],
    ["Etc/UTC","UTC0"],
    ["Etc/Greenwich","GMT0"],
    ["Etc/Universal","UTC0"],
    ["Etc/Zulu","UTC0"],
];

// Build timezone <select> options HTML grouped by region
function buildTimezoneOptionsHtml(selectedValue) {
    const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    let html = '<option value="">Select timezone...</option>';
    const groups = {};
    TIMEZONE_DATA.forEach(([iana, posix]) => {
        const region = iana.split('/')[0];
        if (!groups[region]) groups[region] = [];
        groups[region].push([iana, posix]);
    });
    for (const region of Object.keys(groups)) {
        html += `<optgroup label="${region}">`;
        for (const [iana, posix] of groups[region]) {
            const sel = (posix === selectedValue || iana === selectedValue) ? ' selected' : '';
            html += `<option value="${escAttr(posix)}" data-iana="${iana}"${sel}>${iana}</option>`;
        }
        html += '</optgroup>';
    }
    return html;
}

// Find POSIX TZ string for an IANA timezone name
function ianaToPosx(ianaName) {
    const entry = TIMEZONE_DATA.find(([iana]) => iana === ianaName);
    return entry ? entry[1] : null;
}

// WebScreen Admin UI Application
class WebScreenAdmin {
    constructor() {
        this.serial = new WebScreenSerial();
        this.currentSection = 'dashboard';
        this.availableApps = [];
        this.installedApps = [];
        this.currentPath = '/';
        this.files = [];
        this.sdCardAvailable = false;
        this.currentConfig = null;

        // Sections that require SD card
        this.sdRequiredSections = ['files', 'config'];

        // Terminal
        this.terminal = null;
        this.fitAddon = null;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentInput = '';

        // Loading overlay state
        this.waitingForScriptExecution = false;
        this.scriptExecutionTimeout = null;

        // Bind serial callbacks
        this.serial.onStatusChange = (connected) => this.handleConnectionChange(connected);
        this.serial.onDataReceived = (data) => this.handleSerialData(data);

        this.init();
    }

    async init() {
        // Check Web Serial API support
        if (!WebScreenSerial.isSupported()) {
            this.showToast('Web Serial API not supported in this browser. Please use Chrome, Edge, or Opera.', 'error');
            return;
        }

        // Initialize theme
        this.setupTheme();

        // Initialize terminal
        this.initTerminal();

        // Setup event listeners
        this.setupEventListeners();

        // Load apps from embedded configuration
        this.loadAppsFromConfig();

        // Initialize sections
        this.initializeSections();
    }

    setupTheme() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('webscreen-admin-theme') || 'light';
        this.currentTheme = savedTheme;

        // Apply theme
        this.applyTheme(savedTheme);

        // Setup theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.currentTheme === 'light' ? 'eva' : 'light';
                this.applyTheme(newTheme);
                localStorage.setItem('webscreen-admin-theme', newTheme);
            });
        }
    }

    applyTheme(theme) {
        this.currentTheme = theme;

        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle?.querySelector('i');
        const label = themeToggle?.querySelector('.theme-label');

        if (theme === 'eva') {
            document.documentElement.setAttribute('data-theme', 'eva');
            if (icon) {
                icon.className = 'fas fa-robot';
            }
            if (label) {
                label.textContent = 'EVA';
            }
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (icon) {
                icon.className = 'fas fa-sun';
            }
            if (label) {
                label.textContent = 'Light';
            }
        }
    }

    initTerminal() {
        // Create terminal with custom theme
        this.terminal = new Terminal({
            theme: {
                background: '#0d1117',
                foreground: '#c9d1d9',
                cursor: '#58a6ff',
                cursorAccent: '#0d1117',
                selectionBackground: '#264f78',
                black: '#484f58',
                red: '#ff7b72',
                green: '#3fb950',
                yellow: '#d29922',
                blue: '#58a6ff',
                magenta: '#bc8cff',
                cyan: '#39c5cf',
                white: '#b1bac4',
                brightBlack: '#6e7681',
                brightRed: '#ffa198',
                brightGreen: '#56d364',
                brightYellow: '#e3b341',
                brightBlue: '#79c0ff',
                brightMagenta: '#d2a8ff',
                brightCyan: '#56d4dd',
                brightWhite: '#f0f6fc'
            },
            fontFamily: '"Cascadia Code", "Fira Code", Menlo, Monaco, "Courier New", monospace',
            fontSize: 13,
            lineHeight: 1.4,
            cursorBlink: true,
            cursorStyle: 'bar',
            scrollback: 1000,
            convertEol: true
        });

        // Fit addon to auto-resize terminal
        this.fitAddon = new FitAddon.FitAddon();
        this.terminal.loadAddon(this.fitAddon);

        // Open terminal in container
        const terminalContainer = document.getElementById('terminal');
        if (terminalContainer) {
            this.terminal.open(terminalContainer);

            // Delay fit to allow CSS padding to be applied
            setTimeout(() => {
                this.fitAddon.fit();
            }, 50);

            // Handle window resize
            window.addEventListener('resize', () => {
                setTimeout(() => this.fitAddon.fit(), 10);
            });

            // Write welcome message
            this.writeToTerminal('\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m\r\n');
            this.writeToTerminal('\x1b[1;36m║\x1b[0m   \x1b[1;37mWebScreen Serial Console\x1b[0m          \x1b[1;36m║\x1b[0m\r\n');
            this.writeToTerminal('\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m\r\n\r\n');
            this.writeToTerminal('\x1b[33mConnect to a device to start...\x1b[0m\r\n\r\n');

            // Handle terminal input
            this.terminal.onData((data) => this.handleTerminalInput(data));
        }
    }

    handleTerminalInput(data) {
        if (!this.serial.connected) {
            return;
        }

        // Handle special keys
        switch (data) {
            case '\r': // Enter
                this.terminal.write('\r\n');
                if (this.currentInput.trim()) {
                    this.commandHistory.push(this.currentInput);
                    this.historyIndex = this.commandHistory.length;
                    this.sendTerminalCommand(this.currentInput);
                }
                this.currentInput = '';
                this.writePrompt();
                break;

            case '\x7f': // Backspace
                if (this.currentInput.length > 0) {
                    this.currentInput = this.currentInput.slice(0, -1);
                    this.terminal.write('\b \b');
                }
                break;

            case '\x1b[A': // Up arrow
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.replaceInput(this.commandHistory[this.historyIndex]);
                }
                break;

            case '\x1b[B': // Down arrow
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.replaceInput(this.commandHistory[this.historyIndex]);
                } else {
                    this.historyIndex = this.commandHistory.length;
                    this.replaceInput('');
                }
                break;

            case '\x03': // Ctrl+C
                this.terminal.write('^C\r\n');
                this.currentInput = '';
                this.writePrompt();
                break;

            default:
                // Regular character input
                if (data >= ' ' || data === '\t') {
                    this.currentInput += data;
                    this.terminal.write(data);
                }
        }
    }

    replaceInput(newInput) {
        // Clear current input from terminal
        const clearLength = this.currentInput.length;
        this.terminal.write('\b'.repeat(clearLength) + ' '.repeat(clearLength) + '\b'.repeat(clearLength));
        // Write new input
        this.currentInput = newInput;
        this.terminal.write(newInput);
    }

    writePrompt() {
        this.terminal.write('\x1b[1;32mWebScreen\x1b[0m\x1b[1;37m>\x1b[0m ');
    }

    writeToTerminal(text) {
        if (this.terminal) {
            this.terminal.write(text);
        }
    }

    async sendTerminalCommand(command) {
        try {
            await this.serial.sendCommand(command);
        } catch (error) {
            this.writeToTerminal(`\x1b[31mError: ${error.message}\x1b[0m\r\n`);
        }
    }

    setupEventListeners() {
        // Connection button
        document.getElementById('connectBtn').addEventListener('click', () => this.toggleConnection());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;

                // Check if section requires SD card
                if (this.sdRequiredSections.includes(section) && !this.sdCardAvailable) {
                    this.showToast('SD card required for this section', 'warning');
                    return;
                }

                this.switchSection(section);
            });
        });

        // Dashboard actions
        document.getElementById('rebootBtn')?.addEventListener('click', () => this.rebootDevice());
        document.getElementById('backupBtn')?.addEventListener('click', () => this.backupConfig());
        document.getElementById('factoryResetBtn')?.addEventListener('click', () => this.factoryReset());
        document.getElementById('refreshInfoBtn')?.addEventListener('click', () => this.refreshDeviceInfo());

        // Serial Console
        document.getElementById('clearConsoleBtn')?.addEventListener('click', () => this.clearTerminal());

        // Marketplace
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterApps(btn.dataset.category);
            });
        });

        document.getElementById('appSearch')?.addEventListener('input', (e) => {
            this.searchApps(e.target.value);
        });

        // File Manager
        this.setupFileManager();

        // Settings
        document.getElementById('saveSystemBtn')?.addEventListener('click', () => this.saveSystemSettings());
        document.getElementById('reloadConfigBtn')?.addEventListener('click', () => this.reloadConfig());

        // Modal
        document.getElementById('closeModal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancelInstallBtn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('installAppBtn')?.addEventListener('click', () => this.installApp());
    }

    setupFileManager() {
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');

        // File upload
        uploadBtn?.addEventListener('click', () => fileInput.click());
        fileInput?.addEventListener('change', (e) => this.handleFileUpload(e.target.files));

        // Drag and drop
        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                this.handleFileUpload(e.dataTransfer.files);
            });
        }

        // File actions
        document.getElementById('newFolderBtn')?.addEventListener('click', () => this.createNewFolder());
        document.getElementById('refreshFilesBtn')?.addEventListener('click', () => this.refreshFiles());
    }

    async toggleConnection() {
        if (this.serial.connected) {
            await this.serial.disconnect();
        } else {
            try {
                await this.serial.connect();
                // Give device time to initialize after connection
                this.showToast('Connected! Loading device info...', 'info');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await this.loadDeviceInfo();
            } catch (error) {
                this.showToast('Failed to connect to device', 'error');
            }
        }
    }

    handleConnectionChange(connected) {
        const btn = document.getElementById('connectBtn');
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');

        if (connected) {
            btn.innerHTML = '<i class="fas fa-plug-circle-xmark"></i> Disconnect';
            indicator.classList.add('connected');
            statusText.textContent = 'Connected';
            this.showToast('Connected to WebScreen', 'success');

            // Show connected message in terminal
            this.writeToTerminal('\x1b[1;32m✓ Connected to WebScreen\x1b[0m\r\n');
            this.writeToTerminal('\x1b[90mType /help for available commands\x1b[0m\r\n\r\n');
            this.writePrompt();
        } else {
            btn.innerHTML = '<i class="fas fa-plug"></i> Connect Device';
            indicator.classList.remove('connected');
            statusText.textContent = 'Disconnected';

            // Reset SD card status when disconnected
            this.sdCardAvailable = false;
            this.updateSDCardDependentSections();

            // Show disconnected message in terminal
            this.writeToTerminal('\r\n\x1b[1;31m✗ Disconnected\x1b[0m\r\n');
            this.writeToTerminal('\x1b[33mConnect to a device to continue...\x1b[0m\r\n\r\n');

            // Reset terminal input state
            this.currentInput = '';
            this.historyIndex = this.commandHistory.length;
        }

        // Enable/disable controls based on connection
        this.updateControlsState(connected);
    }

    handleSerialData(data) {
        console.log('Serial data:', data);
        // Display in terminal - handle multiline data properly
        if (this.terminal) {
            // Convert newlines and write to terminal
            const formattedData = data.replace(/\n/g, '\r\n');
            this.terminal.write(formattedData + '\r\n');
        }

        // Check if we're waiting for script execution
        if (this.waitingForScriptExecution) {
            // Look for success messages from the device
            // The firmware may output various messages when script starts/completes
            const successPatterns = [
                'JavaScript script executed successfully',
                'Script executed successfully',
                'Starting JavaScript execution',
                'JavaScript execution',
                'script executed',
                'Elk JS',
                'JS execution complete'
            ];

            const lowerData = data.toLowerCase();
            const matched = successPatterns.some(pattern =>
                lowerData.includes(pattern.toLowerCase())
            );

            if (matched) {
                console.log('Script execution detected, hiding loading modal');
                this.hideLoadingModal();
            }
        }
    }

    clearTerminal() {
        if (this.terminal) {
            this.terminal.clear();
            this.writeToTerminal('\x1b[2J\x1b[H'); // Clear screen and move cursor home
            this.writeToTerminal('\x1b[90mConsole cleared\x1b[0m\r\n\r\n');
            if (this.serial.connected) {
                this.writePrompt();
            }
        }
    }

    updateControlsState(enabled) {
        // Update all interactive elements based on connection state
        const controls = document.querySelectorAll('.action-btn, .form-control, .btn-primary:not(#connectBtn)');
        controls.forEach(control => {
            control.disabled = !enabled;
        });
    }

    async loadDeviceInfo() {
        try {
            // Send a blank line first to wake up the device/clear any pending input
            await this.serial.sendCommand('');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get device information (chip model, firmware version, etc.)
            const info = await this.serial.getDeviceInfo();
            if (info) {
                document.getElementById('deviceModel').textContent = info.chipModel || '-';
                document.getElementById('deviceRevision').textContent = info.chipRevision || '-';
                document.getElementById('deviceVersion').textContent = info.firmwareVersion || '-';
                document.getElementById('deviceSDK').textContent = info.sdkVersion || '-';
                document.getElementById('deviceFlashSize').textContent = info.flashSize || '-';
                document.getElementById('deviceFlashSpeed').textContent = info.flashSpeed || '-';
                document.getElementById('deviceMAC').textContent = info.macAddress || '-';
                document.getElementById('deviceBuildDate').textContent = info.buildDate || '-';
            }

            // Get system statistics (memory, storage, WiFi, etc.)
            const stats = await this.serial.getStats();
            if (stats) {
                document.getElementById('deviceMemory').textContent = stats.freeHeap || '-';
                document.getElementById('deviceTotalHeap').textContent = stats.totalHeap || '-';
                document.getElementById('deviceFreePSRAM').textContent = stats.freePSRAM || '-';
                document.getElementById('deviceTotalPSRAM').textContent = stats.totalPSRAM || '-';
                // Show SD card info: either size details or status
                if (stats.sdCardSize) {
                    document.getElementById('deviceStorage').textContent =
                        `${stats.sdCardUsed || '?'} / ${stats.sdCardSize}`;
                } else {
                    document.getElementById('deviceStorage').textContent = stats.sdCard || '-';
                }
                document.getElementById('deviceCPU').textContent = stats.cpuFrequency || '-';
                document.getElementById('deviceWifi').textContent = stats.wifi || '-';
                document.getElementById('deviceIP').textContent = stats.ip || '-';
                document.getElementById('deviceUptime').textContent = stats.uptime || '-';

                // Also update Network Status section
                const netStatus = document.getElementById('netStatus');
                const netIP = document.getElementById('netIP');
                const netSignal = document.getElementById('netSignal');
                const netMAC = document.getElementById('netMAC');

                if (netStatus) netStatus.textContent = stats.wifi || 'Not Connected';
                if (netIP) netIP.textContent = stats.ip || '-';
                if (netSignal) netSignal.textContent = stats.signalStrength || '-';
                if (netMAC && info) netMAC.textContent = info.macAddress || '-';

                // Check SD card availability - if we have sdCardSize, it's definitely mounted
                this.sdCardAvailable = !!(stats.sdCardSize ||
                    (stats.sdCard && !stats.sdCard.toLowerCase().includes('not mounted') &&
                     !stats.sdCard.toLowerCase().includes('not detected')));
                console.log('SD Card available:', this.sdCardAvailable, 'sdCardSize:', stats.sdCardSize, 'sdCard:', stats.sdCard);
                this.updateSDCardDependentSections();
            }

            // Load files and config only if SD card is available
            if (this.sdCardAvailable) {
                await this.refreshFiles();
                // Load current webscreen.json config and populate form fields
                await this.loadCurrentConfig();
                // Populate auto-start dropdown with installed apps
                await this.populateAutoStartDropdown();
            }
        } catch (error) {
            console.error('Failed to load device info:', error);
        }
    }

    // Populate auto-start dropdown with JS files from SD card
    async populateAutoStartDropdown() {
        const autoStartSelect = document.getElementById('autoStart');
        if (!autoStartSelect) return;

        // Keep the "None" option
        const noneOption = autoStartSelect.querySelector('option[value=""]');
        autoStartSelect.innerHTML = '';
        if (noneOption) {
            autoStartSelect.appendChild(noneOption);
        } else {
            const none = document.createElement('option');
            none.value = '';
            none.textContent = 'None';
            autoStartSelect.appendChild(none);
        }

        // Add JS files from the file list
        for (const file of this.files) {
            if (file.type === 'file' && file.name.endsWith('.js')) {
                const option = document.createElement('option');
                option.value = file.name;
                option.textContent = file.name;
                // Select if this is the current script
                if (this.currentConfig?.script === file.name) {
                    option.selected = true;
                }
                autoStartSelect.appendChild(option);
            }
        }
    }

    updateSDCardDependentSections() {
        console.log('updateSDCardDependentSections called, sdCardAvailable:', this.sdCardAvailable);
        // Update nav items that require SD card
        this.sdRequiredSections.forEach(section => {
            const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
            console.log(`Section ${section}: navItem found:`, !!navItem);
            if (navItem) {
                if (this.sdCardAvailable) {
                    navItem.classList.remove('disabled');
                    navItem.style.opacity = '1';
                    navItem.style.pointerEvents = 'auto';
                    console.log(`Enabled section: ${section}`);
                } else {
                    navItem.classList.add('disabled');
                    navItem.style.opacity = '0.4';
                    navItem.style.pointerEvents = 'auto'; // Keep clickable to show warning
                    console.log(`Disabled section: ${section}`);
                }
            }
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        // Update content
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section);
        });

        this.currentSection = section;

        // Section-specific initialization
        if (section === 'files' && this.serial.connected && this.sdCardAvailable) {
            console.log('switchSection: Triggering refreshFiles for files section');
            this.refreshFiles();
        } else if (section === 'files') {
            console.log('switchSection: Cannot refresh files - connected:', this.serial.connected, 'sdCardAvailable:', this.sdCardAvailable);
        }

        // Reload config when switching to settings or network sections
        if ((section === 'config' || section === 'network') && this.serial.connected && this.sdCardAvailable) {
            console.log('switchSection: Reloading config for', section);
            this.loadCurrentConfig();
        }
    }

    // Dashboard functions
    async rebootDevice() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (confirm('Are you sure you want to restart the device?')) {
            try {
                await this.serial.reboot();
                this.showToast('Device is restarting...', 'info');
            } catch (error) {
                this.showToast('Failed to restart device', 'error');
            }
        }
    }

    async backupConfig() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        try {
            const backup = await this.serial.backup();
            if (backup) {
                // Create download link
                const blob = new Blob([backup], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `webscreen-backup-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                this.showToast('Configuration backed up successfully', 'success');
            }
        } catch (error) {
            this.showToast('Failed to backup configuration', 'error');
        }
    }

    async factoryReset() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (confirm('Are you sure you want to factory reset the device? This will erase all settings and data.')) {
            if (confirm('This action cannot be undone. Continue with factory reset?')) {
                try {
                    await this.serial.factoryReset();
                    this.showToast('Device reset to factory settings', 'success');
                } catch (error) {
                    this.showToast('Failed to reset device', 'error');
                }
            }
        }
    }

    async refreshDeviceInfo() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        this.showToast('Refreshing device info...', 'info');
        await this.loadDeviceInfo();
        this.showToast('Device info refreshed', 'success');
    }

    // Marketplace functions
    loadAppsFromConfig() {
        try {
            // Embedded apps configuration
            this.availableApps = [
                {
                    "name": "Blink LED",
                    "id": "blink",
                    "category": "utilities",
                    "description": "Simple LED blinking example to test your WebScreen setup",
                    "icon": "fa-lightbulb",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/blink",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/blink/script.js",
                    "size": 1,
                    "featured": true
                },
                {
                    "name": "Time API",
                    "id": "timeapi",
                    "category": "productivity",
                    "description": "Display current time and date from world time API",
                    "icon": "fa-clock",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/timeapi",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/timeapi/script.js",
                    "size": 2,
                    "featured": true
                },
                {
                    "name": "SD Card Reader",
                    "id": "sd_reader",
                    "category": "utilities",
                    "description": "Read and display files from your SD card storage",
                    "icon": "fa-sd-card",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/sd_reader",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/sd_reader/script.js",
                    "size": 1,
                    "featured": false
                },
                {
                    "name": "Weather Display",
                    "id": "weather_app",
                    "category": "productivity",
                    "description": "Show current weather conditions and forecast",
                    "icon": "fa-cloud-sun",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/weather",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/weather/script.js",
                    "size": 3,
                    "featured": true
                },
                {
                    "name": "Digital Clock",
                    "id": "digital_clock",
                    "category": "utilities",
                    "description": "Beautiful digital clock with customizable themes",
                    "icon": "fa-clock",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/clock",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/clock/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "System Monitor",
                    "id": "system_monitor",
                    "category": "utilities",
                    "description": "Monitor system performance and resource usage",
                    "icon": "fa-chart-line",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/monitor",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/monitor/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Snake Game",
                    "id": "snake_game",
                    "category": "games",
                    "description": "Classic snake game with touch controls",
                    "icon": "fa-gamepad",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/snake",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/snake/script.js",
                    "size": 4,
                    "featured": true
                },
                {
                    "name": "Music Player",
                    "id": "music_player",
                    "category": "social",
                    "description": "Control your favorite music streaming services",
                    "icon": "fa-music",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/music",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/music/script.js",
                    "size": 3,
                    "featured": false
                },
                {
                    "name": "Notification Center",
                    "id": "notifications",
                    "category": "productivity",
                    "description": "Centralized notification hub for all your services",
                    "icon": "fa-bell",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/notifications",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/notifications/script.js",
                    "size": 3,
                    "featured": true
                },
                {
                    "name": "Teleprompter",
                    "id": "teleprompter",
                    "category": "productivity",
                    "description": "Scrolling text display for presentations and speeches",
                    "icon": "fa-scroll",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/teleprompter",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/teleprompter/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Steam Connect",
                    "id": "steam_connect",
                    "category": "games",
                    "description": "Display Steam profile, friends online, and game activity",
                    "icon": "fa-steam",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/steam",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/steam/script.js",
                    "size": 3,
                    "featured": true
                },
                {
                    "name": "Stock Ticker",
                    "id": "stock_ticker",
                    "category": "productivity",
                    "description": "Real-time stock prices and market information",
                    "icon": "fa-chart-line",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/stocks",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/stocks/script.js",
                    "size": 3,
                    "featured": true
                },
                {
                    "name": "Pomodoro Timer",
                    "id": "pomodoro",
                    "category": "productivity",
                    "description": "Focus timer with work and break intervals for productivity",
                    "icon": "fa-p",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/pomodoro",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/pomodoro/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "RSS Reader",
                    "id": "rss_reader",
                    "category": "productivity",
                    "description": "Display latest news and updates from RSS feeds",
                    "icon": "fa-rss",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/rss",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/rss/script.js",
                    "size": 3,
                    "featured": false
                },
                {
                    "name": "IoT Monitor",
                    "id": "iot_monitor",
                    "category": "utilities",
                    "description": "Monitor and control IoT devices and sensors",
                    "icon": "fa-microchip",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/iot",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/iot/script.js",
                    "size": 4,
                    "featured": true
                },
                {
                    "name": "Bid Watcher",
                    "id": "bid_watcher",
                    "category": "productivity",
                    "description": "Track auction bids and marketplace listings",
                    "icon": "fa-gavel",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/auctions",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/auctions/script.js",
                    "size": 3,
                    "featured": false
                },
                {
                    "name": "Reminders",
                    "id": "reminders",
                    "category": "productivity",
                    "description": "Personal reminder system with notifications and alerts",
                    "icon": "fa-calendar-days",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/reminders",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/reminders/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Timer & Stopwatch",
                    "id": "timer",
                    "category": "utilities",
                    "description": "Countdown timer and stopwatch for productivity",
                    "icon": "fa-stopwatch",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/timer",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/timer/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Social Feed",
                    "id": "social_feed",
                    "category": "social",
                    "description": "Display your social media feeds and updates",
                    "icon": "fa-hashtag",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/social",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/social/script.js",
                    "size": 4,
                    "featured": false
                },
                {
                    "name": "Calculator",
                    "id": "calculator",
                    "category": "utilities",
                    "description": "Basic calculator with arithmetic operations",
                    "icon": "fa-calculator",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/calculator",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/calculator/script.js",
                    "size": 2,
                    "featured": false
                },
                {
                    "name": "Dual Clock",
                    "id": "dual_clock",
                    "category": "productivity",
                    "description": "Display two time zones simultaneously with automatic sync",
                    "icon": "fa-clock",
                    "github_url": "https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/dual_clock",
                    "main_file": "https://raw.githubusercontent.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/main/examples/dual_clock/script.js",
                    "size": 3,
                    "featured": true
                }
            ];

            this.renderApps();
            console.log(`Loaded ${this.availableApps.length} apps from embedded configuration`);
        } catch (error) {
            console.error('Failed to load apps from configuration:', error);
            this.showToast('Failed to load app catalog', 'error');
            this.loadFallbackApps();
        }
    }

    loadFallbackApps() {
        // Minimal fallback apps if JSON loading fails
        this.availableApps = [
            {
                name: 'Blink LED',
                id: 'blink',
                category: 'utilities',
                description: 'Simple LED blinking example to test your WebScreen setup',
                icon: 'fa-lightbulb',
                github_url: 'https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/blink',
                main_file: null,
                size: 1,
                featured: true
            },
            {
                name: 'Time API',
                id: 'timeapi',
                category: 'productivity',
                description: 'Display current time and date from world time API',
                icon: 'fa-clock',
                github_url: 'https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/timeapi',
                main_file: null,
                size: 2,
                featured: true
            },
            {
                name: 'System Monitor',
                id: 'system_monitor',
                category: 'utilities',
                description: 'Monitor system performance and resource usage',
                icon: 'fa-chart-line',
                github_url: 'https://github.com/HW-Lab-Hardware-Design-Agency/WebScreen-Awesome/tree/main/examples/monitor',
                main_file: null,
                size: 2,
                featured: false
            }
        ];
        this.renderApps();
    }


    renderApps(category = 'all', search = '') {
        const grid = document.getElementById('appsGrid');
        if (!grid) return;

        let apps = this.availableApps;

        // Filter by category
        if (category === 'featured') {
            apps = apps.filter(app => app.featured === true);
        } else if (category !== 'all') {
            apps = apps.filter(app => app.category === category);
        }

        // Filter by search
        if (search) {
            apps = apps.filter(app =>
                app.name.toLowerCase().includes(search.toLowerCase()) ||
                app.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        grid.innerHTML = apps.map(app => `
            <div class="app-card" data-app-id="${app.id}">
                <div class="app-card-icon">
                    <i class="fas ${app.icon}"></i>
                </div>
                <div class="app-card-name">${app.name}</div>
                <div class="app-card-category">${app.category}</div>
            </div>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.app-card').forEach(card => {
            card.addEventListener('click', () => {
                const appId = card.dataset.appId;
                const app = this.availableApps.find(a => a.id === appId);
                this.showAppDetails(app);
            });
        });
    }

    filterApps(category) {
        this.renderApps(category);
    }

    searchApps(query) {
        const category = document.querySelector('.category-btn.active')?.dataset.category || 'all';
        this.renderApps(category, query);
    }

    showAppDetails(app) {
        document.getElementById('modalAppName').textContent = app.name;
        document.getElementById('modalAppDesc').textContent = app.description;
        document.getElementById('modalAppVersion').textContent = '1.0.0';
        document.getElementById('modalAppAuthor').textContent = 'HW Media Lab LLC';
        document.getElementById('modalAppSize').textContent = `${app.size} KB`;

        const modalIcon = document.getElementById('modalAppIcon');
        modalIcon.style.display = 'none'; // Hide img, show icon instead
        modalIcon.insertAdjacentHTML('afterend', `
            <div class="app-card-icon" style="margin: 0 auto 1.5rem;">
                <i class="fas ${app.icon}"></i>
            </div>
        `);

        // Update install button state based on connection and SD card
        const installBtn = document.getElementById('installAppBtn');
        if (!this.serial.connected) {
            installBtn.disabled = true;
            installBtn.innerHTML = '<i class="fas fa-plug"></i> Connect Device First';
            installBtn.title = 'Connect to a WebScreen device to install apps';
        } else if (!this.sdCardAvailable) {
            installBtn.disabled = true;
            installBtn.innerHTML = '<i class="fas fa-sd-card"></i> SD Card Required';
            installBtn.title = 'Insert an SD card to install apps';
        } else {
            installBtn.disabled = false;
            installBtn.innerHTML = '<i class="fas fa-download"></i> Install to SD Card';
            installBtn.title = 'Download and install this app to your WebScreen';
        }

        document.getElementById('appModal').classList.add('active');
        document.getElementById('appModal').dataset.appId = app.id;
    }

    closeModal() {
        document.getElementById('appModal').classList.remove('active');
        // Clean up inserted icon
        const insertedIcon = document.querySelector('.modal-body .app-card-icon');
        if (insertedIcon) insertedIcon.remove();
    }

    async installApp() {
        const modal = document.getElementById('appModal');
        const appId = modal.dataset.appId;
        const app = this.availableApps.find(a => a.id === appId);

        if (!app || !app.main_file) {
            this.showToast('App installation file not found', 'error');
            return;
        }

        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (!this.sdCardAvailable) {
            this.showToast('SD card required to install apps', 'warning');
            return;
        }

        const installBtn = document.getElementById('installAppBtn');
        const cancelBtn = document.getElementById('cancelInstallBtn');
        const progressEl = document.getElementById('installProgress');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressIcon = document.getElementById('progressIcon');
        const progressStatus = progressEl.querySelector('.progress-status');

        // Hide buttons and show progress
        installBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        progressEl.style.display = 'block';

        // Helper to update progress
        const updateProgress = (step, percent, text) => {
            progressBar.style.width = `${percent}%`;
            progressText.textContent = text;

            // Update step indicators
            for (let i = 1; i <= 4; i++) {
                const stepEl = document.getElementById(`step${i}`);
                stepEl.classList.remove('active', 'completed');
                if (i < step) {
                    stepEl.classList.add('completed');
                } else if (i === step) {
                    stepEl.classList.add('active');
                }
            }
        };

        // Helper to show error
        const showError = (message) => {
            progressStatus.classList.add('error');
            progressIcon.classList.remove('fa-spinner', 'fa-spin');
            progressIcon.classList.add('fa-exclamation-circle');
            progressText.textContent = message;
            progressBar.style.background = 'var(--danger-color)';

            // Show buttons again after error
            setTimeout(() => {
                installBtn.style.display = '';
                cancelBtn.style.display = '';
                progressEl.style.display = 'none';
                // Reset progress state
                progressStatus.classList.remove('error');
                progressIcon.classList.remove('fa-exclamation-circle');
                progressIcon.classList.add('fa-spinner', 'fa-spin');
                progressBar.style.width = '0%';
                progressBar.style.background = '';
            }, 3000);
        };

        // Helper to show success
        const showSuccess = (message) => {
            progressStatus.classList.add('success');
            progressIcon.classList.remove('fa-spinner', 'fa-spin');
            progressIcon.classList.add('fa-check-circle');
            progressText.textContent = message;
        };

        // Get the base URL for this app's folder
        const getAppBaseUrl = () => {
            // Extract base URL from main_file (remove script.js from the end)
            const mainFile = app.main_file;
            return mainFile.substring(0, mainFile.lastIndexOf('/') + 1);
        };

        try {
            // Step 1: Fetch app.json to get assets list, then download app code
            updateProgress(1, 5, 'Fetching app configuration...');

            const baseUrl = getAppBaseUrl();
            const appJsonUrl = baseUrl + 'app.json';
            let assets = [];

            try {
                const appJsonResponse = await fetch(appJsonUrl);
                if (appJsonResponse.ok) {
                    const appConfig = await appJsonResponse.json();
                    assets = appConfig.assets || [];
                    console.log(`Found ${assets.length} assets for ${app.name}:`, assets);
                }
            } catch (e) {
                console.log('Could not fetch app.json, proceeding without assets:', e);
            }

            updateProgress(1, 10, 'Downloading app from GitHub...');
            const response = await fetch(app.main_file);
            if (!response.ok) {
                throw new Error('Failed to download app from GitHub');
            }
            const code = await response.text();
            updateProgress(1, 20, 'Download complete');

            // Step 2: Download and upload assets (if any)
            if (assets.length > 0) {
                updateProgress(2, 25, `Downloading ${assets.length} asset(s)...`);

                for (let i = 0; i < assets.length; i++) {
                    const assetName = assets[i];
                    const assetUrl = baseUrl + assetName;
                    const progressPercent = 25 + (i / assets.length) * 20;

                    updateProgress(2, progressPercent, `Downloading ${assetName}...`);

                    try {
                        const assetResponse = await fetch(assetUrl);
                        if (!assetResponse.ok) {
                            console.warn(`Failed to download asset: ${assetName}`);
                            continue;
                        }

                        // Determine if asset is binary or text
                        const ext = assetName.substring(assetName.lastIndexOf('.')).toLowerCase();
                        const textExtensions = ['.js', '.json', '.txt', '.html', '.css', '.xml', '.csv', '.md', '.pem'];
                        const isTextFile = textExtensions.includes(ext);

                        let assetContent;
                        if (isTextFile) {
                            assetContent = await assetResponse.text();
                        } else {
                            assetContent = await assetResponse.arrayBuffer();
                        }

                        updateProgress(2, progressPercent + 5, `Uploading ${assetName}...`);
                        await this.serial.uploadFile('/' + assetName, assetContent);
                        console.log(`Uploaded asset: ${assetName}`);

                    } catch (assetError) {
                        console.warn(`Error processing asset ${assetName}:`, assetError);
                    }
                }

                updateProgress(2, 45, 'Assets uploaded');
            }

            // Step 3: Upload script to SD card
            updateProgress(3, 50, 'Uploading script to SD card...');
            const scriptFilename = `${app.id}.js`;
            await this.serial.uploadFile(scriptFilename, code);
            updateProgress(3, 65, 'Script uploaded');

            // Step 4: Update the script setting in config
            updateProgress(4, 70, 'Updating configuration...');
            await this.serial.setConfig('script', scriptFilename);
            updateProgress(4, 85, 'Configuration saved');

            // Mark all steps as completed
            for (let i = 1; i <= 4; i++) {
                document.getElementById(`step${i}`).classList.remove('active');
                document.getElementById(`step${i}`).classList.add('completed');
            }

            updateProgress(4, 100, 'Restarting device to load app...');
            showSuccess(`${app.name} installed successfully! Device is restarting...`);

            // Wait a moment for the user to see the success message, then reboot
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Close modal and show global loading overlay
            this.closeModal();
            // Reset progress UI for next time
            installBtn.style.display = '';
            cancelBtn.style.display = '';
            progressEl.style.display = 'none';
            progressStatus.classList.remove('success');
            progressIcon.classList.remove('fa-check-circle');
            progressIcon.classList.add('fa-spinner', 'fa-spin');
            progressBar.style.width = '0%';
            for (let i = 1; i <= 4; i++) {
                document.getElementById(`step${i}`).classList.remove('active', 'completed');
            }

            // Show loading modal
            this.showLoadingModal(
                'Starting ' + app.name,
                'Device is restarting and loading your app...'
            );

            // Reboot the device
            await this.serial.reboot();

        } catch (error) {
            console.error('Failed to install app:', error);
            showError(`Installation failed: ${error.message}`);
            this.showToast(`Failed to install app: ${error.message}`, 'error');
        }
    }

    // File Manager functions
    async refreshFiles() {
        if (!this.serial.connected) {
            console.log('refreshFiles: Not connected');
            return;
        }

        if (!this.sdCardAvailable) {
            console.log('refreshFiles: SD card not available');
            return;
        }

        // Show loading state
        const fileList = document.getElementById('fileList');
        if (fileList) {
            fileList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Loading files...</div>';
        }

        try {
            console.log('refreshFiles: Loading files from', this.currentPath);
            this.files = await this.serial.listFiles(this.currentPath);
            console.log('refreshFiles: Got files:', this.files);
            this.renderFiles();
        } catch (error) {
            console.error('Failed to load files:', error);
            this.showToast('Failed to load files', 'error');
            if (fileList) {
                fileList.innerHTML = '<div style="text-align: center; color: var(--danger-color); padding: 2rem;"><i class="fas fa-exclamation-circle"></i> Failed to load files</div>';
            }
        }
    }

    renderFiles() {
        const fileList = document.getElementById('fileList');
        if (!fileList) {
            console.log('renderFiles: fileList element not found');
            return;
        }

        console.log('renderFiles: Rendering', this.files.length, 'files');

        if (!this.files || this.files.length === 0) {
            fileList.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    <i class="fas fa-folder-open" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    No files found in ${this.currentPath}
                </div>`;
            return;
        }

        fileList.innerHTML = this.files.map(file => `
            <div class="file-item" data-name="${file.name}" data-type="${file.type}">
                <i class="fas ${file.type === 'dir' ? 'fa-folder' : this.getFileIcon(file.name)}"></i>
                <span class="file-item-name">${file.name}</span>
                <span class="file-item-size">${this.formatFileSize(file.size)}</span>
                <div class="file-item-actions">
                    ${file.type === 'file' ? `
                        <button class="btn-icon" data-action="download" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-icon" data-action="delete" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Add event handlers
        fileList.querySelectorAll('.file-item').forEach(item => {
            const name = item.dataset.name;
            const type = item.dataset.type;

            if (type === 'dir') {
                item.addEventListener('click', () => {
                    this.currentPath = this.currentPath + name + '/';
                    document.getElementById('currentPath').textContent = this.currentPath;
                    this.refreshFiles();
                });
            }

            item.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    if (action === 'delete') {
                        this.deleteFile(name);
                    } else if (action === 'download') {
                        this.downloadFile(name);
                    }
                });
            });
        });
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'js': 'fa-file-code',
            'json': 'fa-file-code',
            'txt': 'fa-file-alt',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio'
        };
        return icons[ext] || 'fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    async handleFileUpload(files) {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (!this.sdCardAvailable) {
            this.showToast('SD card required to upload files', 'warning');
            return;
        }

        for (const file of files) {
            try {
                // Show upload progress overlay
                this.showUploadProgress(file.name, 0, file.size);

                // Determine if file is text or binary based on extension
                const textExtensions = ['.js', '.json', '.txt', '.html', '.css', '.xml', '.csv', '.md'];
                const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                const isTextFile = textExtensions.includes(ext);

                const content = await this.readFileFromBrowser(file, !isTextFile);

                // Include current path in filename
                const fullPath = this.currentPath + file.name;
                console.log('Uploading file to:', fullPath, 'binary:', !isTextFile);

                // Upload with progress callback
                await this.serial.uploadFile(fullPath, content, (sent, total) => {
                    this.updateUploadProgress(file.name, sent, total);
                });

                this.hideUploadProgress();
                this.showToast(`${file.name} uploaded successfully`, 'success');
            } catch (error) {
                console.error('Upload error:', error);
                this.hideUploadProgress();
                this.showToast(`Failed to upload ${file.name}: ${error.message}`, 'error');
            }
        }

        // Refresh file list after upload
        await this.refreshFiles();
    }

    showUploadProgress(filename, sent, total) {
        const overlay = document.getElementById('uploadProgressOverlay');
        const fileNameEl = document.getElementById('uploadFileName');
        const progressBar = document.getElementById('uploadProgressBar');
        const percentEl = document.getElementById('uploadProgressPercent');
        const bytesEl = document.getElementById('uploadProgressBytes');

        overlay.style.display = 'flex';
        fileNameEl.textContent = `Uploading ${filename}...`;
        progressBar.style.width = '0%';
        percentEl.textContent = '0%';
        bytesEl.textContent = `0 B / ${this.formatBytes(total)}`;
    }

    updateUploadProgress(filename, sent, total) {
        const progressBar = document.getElementById('uploadProgressBar');
        const percentEl = document.getElementById('uploadProgressPercent');
        const bytesEl = document.getElementById('uploadProgressBytes');

        const percent = total > 0 ? Math.round((sent / total) * 100) : 0;
        progressBar.style.width = `${percent}%`;
        percentEl.textContent = `${percent}%`;
        bytesEl.textContent = `${this.formatBytes(sent)} / ${this.formatBytes(total)}`;
    }

    hideUploadProgress() {
        const overlay = document.getElementById('uploadProgressOverlay');
        overlay.style.display = 'none';
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    readFileFromBrowser(file, asBinary = false) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            if (asBinary) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    async deleteFile(filename) {
        if (!this.serial.connected) return;

        if (confirm(`Are you sure you want to delete ${filename}?`)) {
            try {
                await this.serial.deleteFile(this.currentPath + filename);
                this.showToast('File deleted', 'success');
                this.refreshFiles();
            } catch (error) {
                this.showToast('Failed to delete file', 'error');
            }
        }
    }

    async downloadFile(filename) {
        // TODO: Implement file download
        this.showToast('Download feature coming soon', 'info');
    }

    createNewFolder() {
        const name = prompt('Enter folder name:');
        if (name) {
            // TODO: Implement folder creation
            this.showToast('Folder creation coming soon', 'info');
        }
    }

    // Settings functions
    async saveSystemSettings() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        if (!this.sdCardAvailable) {
            this.showToast('SD card required to save settings', 'warning');
            return;
        }

        const btn = document.getElementById('saveSystemBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            // Collect all values from dynamic config fields
            const container = document.getElementById('dynamicConfigContainer');

            // Start with normalized current config (migrates old format)
            const updatedConfig = this.normalizeConfig(this.currentConfig || {});

            // Helper to set nested value in object
            const setNestedValue = (obj, path, value) => {
                const keys = path.split('.');
                let current = obj;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;
            };

            // Collect WiFi settings from the form
            const wifiSsid = document.getElementById('wifiSSID')?.value?.trim();
            const wifiPassword = document.getElementById('wifiPassword')?.value;

            if (wifiSsid) {
                updatedConfig.settings.wifi.ssid = wifiSsid;
            }
            if (wifiPassword) {
                updatedConfig.settings.wifi.pass = wifiPassword;
            }

            // Collect brightness setting
            const brightnessSlider = document.getElementById('brightnessSlider');
            if (brightnessSlider) {
                if (!updatedConfig.display) updatedConfig.display = {};
                updatedConfig.display.brightness = parseInt(brightnessSlider.value, 10);
            }

            // Clean up any legacy/temporary keys that shouldn't be in the config file
            delete updatedConfig.wifi;              // Root-level wifi object (old bug)
            delete updatedConfig['wifi.ssid'];      // Flat key from /config set bug
            delete updatedConfig['wifi.password'];  // Flat key from /config set bug
            delete updatedConfig.wifiSsid;          // Temp key from loadCurrentConfig
            delete updatedConfig.wifiPass;          // Temp key from loadCurrentConfig
            delete updatedConfig.device;            // device.name is not used by firmware

            // Collect values from all config inputs
            container.querySelectorAll('[data-config-path]').forEach(input => {
                const path = input.dataset.configPath;

                // Skip color picker inputs (we use the hex input instead)
                if (input.classList.contains('color-picker-input')) {
                    return;
                }

                let value;
                if (input.type === 'checkbox') {
                    value = input.checked;
                } else if (input.type === 'number') {
                    value = parseFloat(input.value) || 0;
                } else {
                    value = input.value;
                }

                setNestedValue(updatedConfig, path, value);
            });

            console.log('Saving updated config:', updatedConfig);

            // Save the updated configuration to webscreen.json
            await this.saveWebScreenConfig(updatedConfig);

            // Update the stored config
            this.currentConfig = updatedConfig;

            this.showToast('Settings saved! Restart device to apply changes.', 'success');

        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showToast('Failed to save settings', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    // Helper to read and update webscreen.json
    async readWebScreenConfig() {
        try {
            console.log('Reading webscreen.json...');
            const content = await this.serial.readFile('/webscreen.json');
            console.log('webscreen.json raw content:', content);
            if (content) {
                const config = JSON.parse(content);
                console.log('webscreen.json parsed:', config);
                return config;
            }
        } catch (e) {
            console.warn('Could not read/parse webscreen.json:', e);
        }
        // Return default config if file doesn't exist or is invalid
        console.log('Using default config');
        return {
            settings: {
                wifi: { ssid: '', pass: '' },
                mqtt: { enabled: false }
            },
            screen: {
                background: '#000000',
                foreground: '#FFFFFF'
            },
            script: '',
            timezone: ''
        };
    }

    // Normalize config to standard format (handles backwards compatibility)
    normalizeConfig(config) {
        const normalized = JSON.parse(JSON.stringify(config));

        // Ensure settings structure exists
        if (!normalized.settings) {
            normalized.settings = {};
        }
        if (!normalized.settings.wifi) {
            normalized.settings.wifi = {};
        }
        if (!normalized.settings.mqtt) {
            normalized.settings.mqtt = { enabled: false };
        }

        // Migrate old wifi format (root level wifi.ssid/wifi.password) to settings.wifi
        if (normalized.wifi && typeof normalized.wifi === 'object') {
            if (normalized.wifi.ssid && !normalized.settings.wifi.ssid) {
                normalized.settings.wifi.ssid = normalized.wifi.ssid;
            }
            if (normalized.wifi.password && !normalized.settings.wifi.pass) {
                normalized.settings.wifi.pass = normalized.wifi.password;
            }
            if (normalized.wifi.pass && !normalized.settings.wifi.pass) {
                normalized.settings.wifi.pass = normalized.wifi.pass;
            }
            // Remove duplicate root-level wifi key
            delete normalized.wifi;
        }

        // Migrate old format: root level wifi.ssid string (from /config set)
        if (normalized['wifi.ssid']) {
            if (!normalized.settings.wifi.ssid) {
                normalized.settings.wifi.ssid = normalized['wifi.ssid'];
            }
            delete normalized['wifi.ssid'];
        }
        if (normalized['wifi.password']) {
            if (!normalized.settings.wifi.pass) {
                normalized.settings.wifi.pass = normalized['wifi.password'];
            }
            delete normalized['wifi.password'];
        }

        // Clean up temporary keys from loadCurrentConfig
        delete normalized.wifiSsid;
        delete normalized.wifiPass;
        delete normalized.device;

        // Ensure screen structure
        if (!normalized.screen) {
            normalized.screen = {
                background: '#000000',
                foreground: '#FFFFFF'
            };
        }

        // Ensure display structure for brightness
        if (!normalized.display) {
            normalized.display = {};
        }
        if (normalized.display.brightness === undefined) {
            normalized.display.brightness = 200;
        }

        return normalized;
    }

    async saveWebScreenConfig(config) {
        const configJson = JSON.stringify(config, null, 2);
        await this.serial.uploadFile('/webscreen.json', configJson);
    }

    // Load current config and populate form fields
    async loadCurrentConfig() {
        if (!this.serial.connected || !this.sdCardAvailable) {
            console.log('loadCurrentConfig: Not connected or no SD card');
            return;
        }

        console.log('loadCurrentConfig: Starting to load config...');

        try {
            // Try to get config values using /config get commands (more reliable)
            const configValues = {};

            // Get WiFi SSID (try both old and new paths)
            let wifiSsid = await this.serial.getConfig('settings.wifi.ssid');
            if (!wifiSsid) wifiSsid = await this.serial.getConfig('wifi.ssid');
            if (wifiSsid) configValues.wifiSsid = wifiSsid;

            // Get WiFi password (might not be returned for security)
            let wifiPass = await this.serial.getConfig('settings.wifi.pass');
            if (!wifiPass) wifiPass = await this.serial.getConfig('wifi.password');
            if (wifiPass) configValues.wifiPass = wifiPass;

            // Get script
            const script = await this.serial.getConfig('script');
            if (script) configValues.script = script;

            console.log('loadCurrentConfig: Got config values:', configValues);

            // Also try reading webscreen.json as fallback
            let fileConfig = await this.readWebScreenConfig();
            // Normalize config for backwards compatibility
            fileConfig = this.normalizeConfig(fileConfig);
            console.log('loadCurrentConfig: Normalized file config:', fileConfig);

            // Merge configs (command values take priority)
            const wifiConfig = fileConfig.settings?.wifi || {};
            const finalSsid = configValues.wifiSsid || wifiConfig.ssid || '';
            const finalPass = configValues.wifiPass || wifiConfig.pass || '';
            const finalScript = configValues.script || fileConfig.script || '';

            console.log('loadCurrentConfig: Final values - SSID:', finalSsid, 'Script:', finalScript);

            // Store current config for later use (normalized, without temp keys)
            this.currentConfig = fileConfig;

            // Render the dynamic config UI (creates WiFi, brightness, etc. DOM elements)
            this.renderDynamicConfig(fileConfig);

            // Populate WiFi fields (after render, since they're created dynamically)
            const ssidField = document.getElementById('wifiSSID');
            const passwordField = document.getElementById('wifiPassword');

            if (ssidField) {
                ssidField.value = finalSsid;
            }
            if (passwordField) {
                passwordField.value = '';
                if (finalPass) {
                    passwordField.placeholder = '••••••••• (password set)';
                } else {
                    passwordField.placeholder = 'Enter WiFi password';
                }
            }

            // Populate brightness slider and attach event listeners
            const brightnessSlider = document.getElementById('brightnessSlider');
            const brightnessValue = document.getElementById('brightnessValue');
            const configBrightness = fileConfig.display?.brightness;
            if (brightnessSlider) {
                if (configBrightness !== undefined) {
                    brightnessSlider.value = configBrightness;
                    if (brightnessValue) brightnessValue.textContent = configBrightness;
                }
                brightnessSlider.addEventListener('input', (e) => {
                    const bv = document.getElementById('brightnessValue');
                    if (bv) bv.textContent = e.target.value;
                });
                brightnessSlider.addEventListener('change', (e) => {
                    if (this.serial.connected) {
                        this.serial.setBrightness(parseInt(e.target.value, 10));
                    }
                });
            }

            // Populate script/auto-start dropdown
            if (finalScript) {
                const autoStartSelect = document.getElementById('autoStart');
                console.log('loadCurrentConfig: Found autoStartSelect:', !!autoStartSelect);
                if (autoStartSelect) {
                    let optionExists = false;
                    for (const option of autoStartSelect.options) {
                        if (option.value === finalScript) {
                            optionExists = true;
                            option.selected = true;
                            break;
                        }
                    }
                    if (!optionExists) {
                        const option = document.createElement('option');
                        option.value = finalScript;
                        option.textContent = finalScript;
                        option.selected = true;
                        autoStartSelect.appendChild(option);
                    }
                    console.log('loadCurrentConfig: Set auto-start script to:', finalScript);
                }
            }

        } catch (error) {
            console.error('Failed to load current config:', error);
        }
    }

    // Reload configuration from device
    async reloadConfig() {
        if (!this.serial.connected || !this.sdCardAvailable) {
            this.showToast('Device not connected or SD card not available', 'warning');
            return;
        }

        const btn = document.getElementById('reloadConfigBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reloading...';
        btn.disabled = true;

        try {
            await this.loadCurrentConfig();
            this.showToast('Configuration reloaded', 'success');
        } catch (error) {
            console.error('Failed to reload config:', error);
            this.showToast('Failed to reload configuration', 'error');
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }

    // Render dynamic configuration fields from JSON config
    renderDynamicConfig(config) {
        const container = document.getElementById('dynamicConfigContainer');
        if (!container) return;

        // Clear loading state
        container.innerHTML = '';

        // Helper to determine if a value looks like a color
        const isColorValue = (value) => {
            if (typeof value !== 'string') return false;
            return /^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value);
        };

        // Better labels for known config keys
        const getLabelForKey = (key, path) => {
            const fullPath = path ? `${path}.${key}` : key;
            const labelMap = {
                'settings.mqtt.enabled': 'MQTT',
                'mqtt.enabled': 'MQTT',
                'screen.background': 'Background Color',
                'screen.foreground': 'Text Color'
            };
            if (labelMap[fullPath]) {
                return labelMap[fullPath];
            }
            // Default: capitalize and add spaces before uppercase letters
            return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        };

        // Keys to completely skip rendering (handled by static UI)
        const skipPaths = [
            'settings.wifi', 'settings.wifi.ssid', 'settings.wifi.pass',
            'wifi', 'wifi.ssid', 'wifi.password', 'wifi.pass',
            'wifiSsid', 'wifiPass',
            'display.brightness'
        ];

        // Helper to create a form field based on value type
        const createField = (key, value, path = '') => {
            const fullPath = path ? `${path}.${key}` : key;

            // Skip paths that are handled by static UI
            if (skipPaths.includes(fullPath) || skipPaths.includes(key)) {
                return '';
            }

            const fieldId = `config-${fullPath.replace(/\./g, '-')}`;
            const labelText = getLabelForKey(key, path);

            let fieldHtml = '';

            if (typeof value === 'boolean') {
                // Toggle switch for booleans
                fieldHtml = `
                    <div class="config-field">
                        <label for="${fieldId}">${labelText}</label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="${fieldId}" data-config-path="${fullPath}" ${value ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                `;
            } else if (typeof value === 'number') {
                // Number input
                fieldHtml = `
                    <div class="config-field">
                        <label for="${fieldId}">${labelText}</label>
                        <input type="number" id="${fieldId}" class="form-control" data-config-path="${fullPath}" value="${value}">
                    </div>
                `;
            } else if (typeof value === 'string') {
                if (isColorValue(value)) {
                    // Color picker for color values
                    fieldHtml = `
                        <div class="config-field">
                            <label for="${fieldId}">${labelText}</label>
                            <div class="color-picker-wrapper">
                                <input type="color" id="${fieldId}-picker" class="color-picker-input" data-config-path="${fullPath}" value="${value}">
                                <input type="text" id="${fieldId}" class="form-control color-hex-input" data-config-path="${fullPath}" value="${value}" placeholder="#FFFFFF">
                            </div>
                        </div>
                    `;
                } else if (key.toLowerCase().includes('pass') || key.toLowerCase().includes('password')) {
                    // Password field
                    fieldHtml = `
                        <div class="config-field">
                            <label for="${fieldId}">${labelText}</label>
                            <div class="password-input">
                                <input type="password" id="${fieldId}" class="form-control" data-config-path="${fullPath}" value="${value}" placeholder="Enter ${labelText.toLowerCase()}">
                                <button type="button" class="btn-icon toggle-password-btn">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    // Regular text input
                    fieldHtml = `
                        <div class="config-field">
                            <label for="${fieldId}">${labelText}</label>
                            <input type="text" id="${fieldId}" class="form-control" data-config-path="${fullPath}" value="${value}">
                        </div>
                    `;
                }
            }

            return fieldHtml;
        };

        // Get appropriate icon for section type
        const getSectionIcon = (title) => {
            const icons = {
                'settings': 'fa-sliders-h',
                'screen': 'fa-desktop',
                'wifi': 'fa-wifi',
                'mqtt': 'fa-broadcast-tower',
                'device': 'fa-microchip',
                'general': 'fa-cog',
                'network': 'fa-network-wired',
                'display': 'fa-tv',
                'theme': 'fa-palette',
                'colors': 'fa-paint-brush'
            };
            return icons[title.toLowerCase()] || 'fa-cog';
        };

        // Helper to create a section from an object
        const createSection = (title, obj, path = '') => {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
                return '';
            }

            let fieldsHtml = '';
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Nested object - create subsection
                    fieldsHtml += createSection(key.charAt(0).toUpperCase() + key.slice(1), value, path ? `${path}.${key}` : key);
                } else if (!Array.isArray(value)) {
                    // Simple value - create field
                    fieldsHtml += createField(key, value, path);
                }
            }

            if (!fieldsHtml) return '';

            const icon = getSectionIcon(title);
            return `
                <div class="config-section">
                    <h3 class="config-section-title"><i class="fas ${icon}"></i> ${title}</h3>
                    <div class="config-section-fields">
                        ${fieldsHtml}
                    </div>
                </div>
            `;
        };

        // Helper to create fields from an object (without section wrapper)
        const createFieldsFromObject = (obj, path = '') => {
            if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
                return '';
            }

            let fieldsHtml = '';
            for (const [key, value] of Object.entries(obj)) {
                const fullPath = path ? `${path}.${key}` : key;

                // Skip paths that are handled by static UI
                if (skipPaths.includes(fullPath) || skipPaths.includes(key)) {
                    continue;
                }

                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Nested object - recurse
                    fieldsHtml += createFieldsFromObject(value, fullPath);
                } else if (!Array.isArray(value)) {
                    // Simple value - create field
                    fieldsHtml += createField(key, value, path);
                }
            }
            return fieldsHtml;
        };

        // Build the dynamic config UI with organized sections
        let html = '';

        // 1. GENERAL SECTION - WiFi + top-level simple properties
        const excludeKeys = ['settings', 'screen', 'wifi', 'mqtt', 'device', 'timezone', 'display'];
        let generalFields = '';

        // WiFi fields
        const wifiSsid = config.settings?.wifi?.ssid || '';
        generalFields += `
            <div class="config-field">
                <label for="wifiSSID">WiFi Network (SSID)</label>
                <input type="text" id="wifiSSID" class="form-control" data-config-path="settings.wifi.ssid" value="${wifiSsid}" placeholder="Enter WiFi network name">
            </div>
            <div class="config-field">
                <label for="wifiPassword">WiFi Password</label>
                <input type="password" id="wifiPassword" class="form-control" placeholder="Enter WiFi password">
            </div>
            <div class="network-status" style="margin: 0.5rem 0; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-color);">
                <div class="status-item">
                    <span class="status-label">Status:</span>
                    <span class="status-value" id="netStatus">Not Connected</span>
                </div>
                <div class="status-item">
                    <span class="status-label">IP Address:</span>
                    <span class="status-value" id="netIP">-</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Signal:</span>
                    <span class="status-value" id="netSignal">-</span>
                </div>
            </div>
        `;

        // Top-level simple properties
        const topLevelFields = {};
        for (const [key, value] of Object.entries(config)) {
            if (!excludeKeys.includes(key) && typeof value !== 'object') {
                topLevelFields[key] = value;
            }
        }
        for (const [key, value] of Object.entries(topLevelFields)) {
            generalFields += createField(key, value, '');
        }

        html += `
            <div class="config-section">
                <h3 class="config-section-title"><i class="fas fa-cog"></i> General</h3>
                <div class="config-section-fields">
                    ${generalFields}
                </div>
            </div>
        `;

        // 2. DEVICE SECTION - includes screen settings + brightness
        let deviceFields = '';
        if (config.device) {
            deviceFields += createFieldsFromObject(config.device, 'device');
        }
        if (config.screen) {
            deviceFields += createFieldsFromObject(config.screen, 'screen');
        }
        // Brightness slider
        deviceFields += `
            <div class="config-field">
                <label for="brightnessSlider">Brightness (<span id="brightnessValue">200</span>/255)</label>
                <input type="range" id="brightnessSlider" class="form-control" min="0" max="255" value="${config.display?.brightness ?? 200}" style="width: 100%;">
            </div>
        `;
        html += `
            <div class="config-section">
                <h3 class="config-section-title"><i class="fas fa-microchip"></i> Device</h3>
                <div class="config-section-fields">
                    ${deviceFields}
                </div>
            </div>
        `;

        // 3. TIME & LOCATION SECTION - editable time/date with sync button
        const currentTimezone = config.timezone || config.device?.timezone || '';
        html += `
            <div class="config-section">
                <h3 class="config-section-title"><i class="fas fa-clock"></i> Time & Location</h3>
                <div class="config-section-fields">
                    <div class="config-field">
                        <label for="config-time">Time</label>
                        <div class="input-with-button">
                            <input type="time" id="config-time" class="form-control" step="1">
                            <button type="button" class="btn btn-secondary btn-detect" id="detectTimeBtn">
                                <i class="fas fa-crosshairs"></i> Detect
                            </button>
                        </div>
                    </div>
                    <div class="config-field">
                        <label for="config-date">Date</label>
                        <input type="date" id="config-date" class="form-control">
                    </div>
                    <div class="config-field">
                        <label for="config-timezone">Timezone</label>
                        <div class="input-with-button">
                            <select id="config-timezone" class="form-control" data-config-path="timezone">
                                ${buildTimezoneOptionsHtml(currentTimezone)}
                            </select>
                            <button type="button" class="btn btn-secondary btn-detect" id="detectTimezoneBtn">
                                <i class="fas fa-crosshairs"></i> Detect
                            </button>
                        </div>
                    </div>
                    <div class="config-field config-field-actions">
                        <label></label>
                        <button type="button" class="btn btn-primary" id="syncTimeBtn">
                            <i class="fas fa-sync"></i> Sync Time to Device
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 4. SETTINGS SECTION - MQTT and other settings (WiFi is managed in Network tab)
        let settingsFields = '';

        // Get MQTT config (either from settings.mqtt or top-level mqtt, not both)
        const mqttConfig = config.settings?.mqtt || config.mqtt;
        if (mqttConfig) {
            const mqttPath = config.settings?.mqtt ? 'settings.mqtt' : 'mqtt';
            settingsFields += createFieldsFromObject(mqttConfig, mqttPath);
        }

        // Add other settings fields (excluding wifi and mqtt which we handled separately)
        if (config.settings) {
            for (const [key, value] of Object.entries(config.settings)) {
                // Skip wifi (managed in Network tab) and mqtt (handled above)
                if (key !== 'wifi' && key !== 'mqtt') {
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        settingsFields += createFieldsFromObject(value, `settings.${key}`);
                    } else if (!Array.isArray(value)) {
                        settingsFields += createField(key, value, 'settings');
                    }
                }
            }
        }

        if (settingsFields) {
            html += `
                <div class="config-section">
                    <h3 class="config-section-title"><i class="fas fa-cog"></i> Advanced Settings</h3>
                    <div class="config-section-fields">
                        ${settingsFields}
                    </div>
                </div>
            `;
        }

        if (!html) {
            html = `
                <div class="config-empty">
                    <i class="fas fa-info-circle"></i>
                    <p>No configuration options available.</p>
                </div>
            `;
        }

        container.innerHTML = html;

        // Setup event listeners for color pickers
        container.querySelectorAll('.color-picker-wrapper').forEach(wrapper => {
            const picker = wrapper.querySelector('.color-picker-input');
            const hexInput = wrapper.querySelector('.color-hex-input');

            if (picker && hexInput) {
                // Sync picker to hex input
                picker.addEventListener('input', () => {
                    hexInput.value = picker.value.toUpperCase();
                });

                // Sync hex input to picker
                hexInput.addEventListener('input', () => {
                    const val = hexInput.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        picker.value = val;
                    }
                });
            }
        });

        // Setup password toggle buttons
        container.querySelectorAll('.toggle-password-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.parentElement.querySelector('input');
                const icon = btn.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.replace('fa-eye', 'fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.replace('fa-eye-slash', 'fa-eye');
                }
            });
        });

        // Setup time/date fields
        const timeInput = document.getElementById('config-time');
        const dateInput = document.getElementById('config-date');
        const detectTimeBtn = document.getElementById('detectTimeBtn');
        const detectTimezoneBtn = document.getElementById('detectTimezoneBtn');
        const timezoneInput = document.getElementById('config-timezone');
        const syncTimeBtn = document.getElementById('syncTimeBtn');

        // Helper to set current browser time/date
        const setCurrentTime = () => {
            const now = new Date();
            if (timeInput) {
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                timeInput.value = `${hours}:${minutes}:${seconds}`;
            }
            if (dateInput) {
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                dateInput.value = `${year}-${month}-${day}`;
            }
        };

        // Set initial values to current time
        setCurrentTime();

        // Detect time button
        if (detectTimeBtn) {
            detectTimeBtn.addEventListener('click', () => {
                setCurrentTime();
                this.showToast('Time updated to current local time', 'success');
            });
        }

        // Setup timezone detect button
        if (detectTimezoneBtn && timezoneInput) {
            // Auto-detect if no timezone selected
            const autoSelectTimezone = (ianaName) => {
                const option = timezoneInput.querySelector(`[data-iana="${ianaName}"]`);
                if (option) {
                    timezoneInput.value = option.value;
                    return true;
                }
                return false;
            };

            if (!timezoneInput.value) {
                autoSelectTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
            }

            detectTimezoneBtn.addEventListener('click', () => {
                const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (autoSelectTimezone(detectedTimezone)) {
                    this.showToast(`Detected timezone: ${detectedTimezone}`, 'success');
                } else {
                    this.showToast(`Timezone "${detectedTimezone}" not found in list`, 'warning');
                }
            });
        }

        // Sync time to device button
        if (syncTimeBtn) {
            syncTimeBtn.addEventListener('click', async () => {
                if (!this.serial.connected) {
                    this.showToast('Please connect to a device first', 'warning');
                    return;
                }

                const timeVal = timeInput?.value;
                const dateVal = dateInput?.value;
                const timezone = timezoneInput?.value || 'UTC0';

                if (!timeVal || !dateVal) {
                    this.showToast('Please set both time and date', 'warning');
                    return;
                }

                // Parse the time and date
                const [hours, minutes, seconds] = timeVal.split(':').map(Number);
                const [year, month, day] = dateVal.split('-').map(Number);

                // Create a Date object and get epoch
                const dateObj = new Date(year, month - 1, day, hours, minutes, seconds || 0);
                const epoch = Math.floor(dateObj.getTime() / 1000);

                syncTimeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
                syncTimeBtn.disabled = true;

                try {
                    const success = await this.serial.syncTime(epoch, timezone);
                    if (success) {
                        this.showToast('Time synced to device!', 'success');
                    } else {
                        this.showToast('Failed to sync time', 'error');
                    }
                } catch (error) {
                    console.error('Time sync error:', error);
                    this.showToast('Failed to sync time', 'error');
                } finally {
                    syncTimeBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Time to Device';
                    syncTimeBtn.disabled = false;
                }
            });
        }
    }

    // WiFi Connection
    async connectWiFi() {
        if (!this.serial.connected) {
            this.showToast('Please connect to a device first', 'warning');
            return;
        }

        const ssid = document.getElementById('wifiSSID').value.trim();
        const password = document.getElementById('wifiPassword').value;

        if (!ssid) {
            this.showToast('Please enter a network name (SSID)', 'warning');
            return;
        }

        try {
            this.showToast('Saving WiFi settings...', 'info');
            await this.serial.connectWiFi(ssid, password);
            this.showToast('WiFi settings saved. Device will reboot and connect to the network.', 'success');
        } catch (error) {
            console.error('Failed to connect WiFi:', error);
            this.showToast('Failed to save WiFi settings', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Loading modal
    showLoadingModal(title = 'Preparing App', message = 'Please wait while the device loads the app') {
        const modal = document.getElementById('loadingModal');
        const titleEl = document.getElementById('loadingTitle');
        const messageEl = document.getElementById('loadingMessage');

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        if (modal) {
            modal.classList.add('active');
        }

        // Set waiting flag
        this.waitingForScriptExecution = true;

        // Set a timeout to auto-hide after 30 seconds (fallback)
        this.scriptExecutionTimeout = setTimeout(() => {
            console.log('Script execution timeout, hiding loading modal');
            this.hideLoadingModal();
        }, 30000);
    }

    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Clear waiting flag and timeout
        this.waitingForScriptExecution = false;
        if (this.scriptExecutionTimeout) {
            clearTimeout(this.scriptExecutionTimeout);
            this.scriptExecutionTimeout = null;
        }
    }

    initializeSections() {
        // Initialize with dashboard
        this.switchSection('dashboard');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.webScreenAdmin = new WebScreenAdmin();
});