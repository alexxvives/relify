const phoneCountryRows = [
  ["AF", "Afganistán", "93"],
  ["AL", "Albania", "355"],
  ["DE", "Alemania", "49"],
  ["AD", "Andorra", "376"],
  ["AO", "Angola", "244"],
  ["AI", "Anguila", "1264"],
  ["AG", "Antigua y Barbuda", "1268"],
  ["SA", "Arabia Saudí", "966"],
  ["DZ", "Argelia", "213"],
  ["AR", "Argentina", "54"],
  ["AM", "Armenia", "374"],
  ["AW", "Aruba", "297"],
  ["AU", "Australia", "61"],
  ["AT", "Austria", "43"],
  ["AZ", "Azerbaiyán", "994"],
  ["BS", "Bahamas", "1242"],
  ["BH", "Baréin", "973"],
  ["BD", "Bangladés", "880"],
  ["BB", "Barbados", "1246"],
  ["BE", "Bélgica", "32"],
  ["BZ", "Belice", "501"],
  ["BJ", "Benín", "229"],
  ["BM", "Bermudas", "1441"],
  ["BY", "Bielorrusia", "375"],
  ["BO", "Bolivia", "591"],
  ["BA", "Bosnia y Herzegovina", "387"],
  ["BW", "Botsuana", "267"],
  ["BR", "Brasil", "55"],
  ["BN", "Brunéi", "673"],
  ["BG", "Bulgaria", "359"],
  ["BF", "Burkina Faso", "226"],
  ["BI", "Burundi", "257"],
  ["BT", "Bután", "975"],
  ["CV", "Cabo Verde", "238"],
  ["KH", "Camboya", "855"],
  ["CM", "Camerún", "237"],
  ["CA", "Canadá", "1"],
  ["QA", "Catar", "974"],
  ["TD", "Chad", "235"],
  ["CL", "Chile", "56"],
  ["CN", "China", "86"],
  ["CY", "Chipre", "357"],
  ["VA", "Ciudad del Vaticano", "379"],
  ["CO", "Colombia", "57"],
  ["KM", "Comoras", "269"],
  ["KP", "Corea del Norte", "850"],
  ["KR", "Corea del Sur", "82"],
  ["CI", "Costa de Marfil", "225"],
  ["CR", "Costa Rica", "506"],
  ["HR", "Croacia", "385"],
  ["CU", "Cuba", "53"],
  ["CW", "Curazao", "599"],
  ["DK", "Dinamarca", "45"],
  ["DM", "Dominica", "1767"],
  ["EC", "Ecuador", "593"],
  ["EG", "Egipto", "20"],
  ["SV", "El Salvador", "503"],
  ["AE", "Emiratos Árabes Unidos", "971"],
  ["ER", "Eritrea", "291"],
  ["SK", "Eslovaquia", "421"],
  ["SI", "Eslovenia", "386"],
  ["ES", "España", "34"],
  ["US", "Estados Unidos", "1"],
  ["EE", "Estonia", "372"],
  ["SZ", "Esuatini", "268"],
  ["ET", "Etiopía", "251"],
  ["PH", "Filipinas", "63"],
  ["FI", "Finlandia", "358"],
  ["FJ", "Fiyi", "679"],
  ["FR", "Francia", "33"],
  ["GA", "Gabón", "241"],
  ["GM", "Gambia", "220"],
  ["GE", "Georgia", "995"],
  ["GH", "Ghana", "233"],
  ["GI", "Gibraltar", "350"],
  ["GD", "Granada", "1473"],
  ["GR", "Grecia", "30"],
  ["GL", "Groenlandia", "299"],
  ["GP", "Guadalupe", "590"],
  ["GU", "Guam", "1671"],
  ["GT", "Guatemala", "502"],
  ["GF", "Guayana Francesa", "594"],
  ["GN", "Guinea", "224"],
  ["GQ", "Guinea Ecuatorial", "240"],
  ["GW", "Guinea-Bisáu", "245"],
  ["GY", "Guyana", "592"],
  ["HT", "Haití", "509"],
  ["HN", "Honduras", "504"],
  ["HK", "Hong Kong", "852"],
  ["HU", "Hungría", "36"],
  ["IN", "India", "91"],
  ["ID", "Indonesia", "62"],
  ["IQ", "Irak", "964"],
  ["IR", "Irán", "98"],
  ["IE", "Irlanda", "353"],
  ["IS", "Islandia", "354"],
  ["KY", "Islas Caimán", "1345"],
  ["CK", "Islas Cook", "682"],
  ["FO", "Islas Feroe", "298"],
  ["FK", "Islas Malvinas", "500"],
  ["MP", "Islas Marianas del Norte", "1670"],
  ["MH", "Islas Marshall", "692"],
  ["SB", "Islas Salomón", "677"],
  ["TC", "Islas Turcas y Caicos", "1649"],
  ["VG", "Islas Vírgenes Británicas", "1284"],
  ["VI", "Islas Vírgenes de EE. UU.", "1340"],
  ["IL", "Israel", "972"],
  ["IT", "Italia", "39"],
  ["JM", "Jamaica", "1876"],
  ["JP", "Japón", "81"],
  ["JO", "Jordania", "962"],
  ["KZ", "Kazajistán", "7"],
  ["KE", "Kenia", "254"],
  ["KG", "Kirguistán", "996"],
  ["KI", "Kiribati", "686"],
  ["XK", "Kosovo", "383"],
  ["KW", "Kuwait", "965"],
  ["LA", "Laos", "856"],
  ["LS", "Lesoto", "266"],
  ["LV", "Letonia", "371"],
  ["LB", "Líbano", "961"],
  ["LR", "Liberia", "231"],
  ["LY", "Libia", "218"],
  ["LI", "Liechtenstein", "423"],
  ["LT", "Lituania", "370"],
  ["LU", "Luxemburgo", "352"],
  ["MO", "Macao", "853"],
  ["MK", "Macedonia del Norte", "389"],
  ["MG", "Madagascar", "261"],
  ["MY", "Malasia", "60"],
  ["MW", "Malaui", "265"],
  ["MV", "Maldivas", "960"],
  ["ML", "Mali", "223"],
  ["MT", "Malta", "356"],
  ["MA", "Marruecos", "212"],
  ["MQ", "Martinica", "596"],
  ["MU", "Mauricio", "230"],
  ["MR", "Mauritania", "222"],
  ["MX", "México", "52"],
  ["FM", "Micronesia", "691"],
  ["MD", "Moldavia", "373"],
  ["MC", "Mónaco", "377"],
  ["MN", "Mongolia", "976"],
  ["ME", "Montenegro", "382"],
  ["MS", "Montserrat", "1664"],
  ["MZ", "Mozambique", "258"],
  ["MM", "Myanmar", "95"],
  ["NA", "Namibia", "264"],
  ["NR", "Nauru", "674"],
  ["NP", "Nepal", "977"],
  ["NI", "Nicaragua", "505"],
  ["NE", "Níger", "227"],
  ["NG", "Nigeria", "234"],
  ["NO", "Noruega", "47"],
  ["NC", "Nueva Caledonia", "687"],
  ["NZ", "Nueva Zelanda", "64"],
  ["OM", "Omán", "968"],
  ["NL", "Países Bajos", "31"],
  ["PK", "Pakistán", "92"],
  ["PW", "Palaos", "680"],
  ["PS", "Palestina", "970"],
  ["PA", "Panamá", "507"],
  ["PG", "Papúa Nueva Guinea", "675"],
  ["PY", "Paraguay", "595"],
  ["PE", "Perú", "51"],
  ["PF", "Polinesia Francesa", "689"],
  ["PL", "Polonia", "48"],
  ["PT", "Portugal", "351"],
  ["PR", "Puerto Rico", "1787"],
  ["GB", "Reino Unido", "44"],
  ["CF", "República Centroafricana", "236"],
  ["CZ", "República Checa", "420"],
  ["CD", "República Democrática del Congo", "243"],
  ["DO", "República Dominicana", "1809"],
  ["CG", "República del Congo", "242"],
  ["RE", "Reunión", "262"],
  ["RW", "Ruanda", "250"],
  ["RO", "Rumanía", "40"],
  ["RU", "Rusia", "7"],
  ["EH", "Sáhara Occidental", "212"],
  ["WS", "Samoa", "685"],
  ["AS", "Samoa Americana", "1684"],
  ["KN", "San Cristóbal y Nieves", "1869"],
  ["SM", "San Marino", "378"],
  ["PM", "San Pedro y Miquelón", "508"],
  ["VC", "San Vicente y las Granadinas", "1784"],
  ["SH", "Santa Elena", "290"],
  ["LC", "Santa Lucía", "1758"],
  ["ST", "Santo Tomé y Príncipe", "239"],
  ["SN", "Senegal", "221"],
  ["RS", "Serbia", "381"],
  ["SC", "Seychelles", "248"],
  ["SL", "Sierra Leona", "232"],
  ["SG", "Singapur", "65"],
  ["SX", "Sint Maarten", "1721"],
  ["SY", "Siria", "963"],
  ["SO", "Somalia", "252"],
  ["LK", "Sri Lanka", "94"],
  ["ZA", "Sudáfrica", "27"],
  ["SD", "Sudán", "249"],
  ["SS", "Sudán del Sur", "211"],
  ["SE", "Suecia", "46"],
  ["CH", "Suiza", "41"],
  ["SR", "Surinam", "597"],
  ["TH", "Tailandia", "66"],
  ["TW", "Taiwán", "886"],
  ["TZ", "Tanzania", "255"],
  ["TJ", "Tayikistán", "992"],
  ["TL", "Timor Oriental", "670"],
  ["TG", "Togo", "228"],
  ["TO", "Tonga", "676"],
  ["TT", "Trinidad y Tobago", "1868"],
  ["TN", "Túnez", "216"],
  ["TM", "Turkmenistán", "993"],
  ["TR", "Turquía", "90"],
  ["TV", "Tuvalu", "688"],
  ["UA", "Ucrania", "380"],
  ["UG", "Uganda", "256"],
  ["UY", "Uruguay", "598"],
  ["UZ", "Uzbekistán", "998"],
  ["VU", "Vanuatu", "678"],
  ["VE", "Venezuela", "58"],
  ["VN", "Vietnam", "84"],
  ["YE", "Yemen", "967"],
  ["DJ", "Yibuti", "253"],
  ["ZM", "Zambia", "260"],
  ["ZW", "Zimbabue", "263"],
] as const;

export type PhoneCountry = {
  iso: string;
  name: string;
  dial: string;
};

export const phoneCountries: readonly PhoneCountry[] = phoneCountryRows.map(([iso, name, dial]) => ({
  iso,
  name,
  dial,
}));

const countriesByIso = new Map(phoneCountries.map((country) => [country.iso, country]));

const countriesByDialLength = [...phoneCountries].sort((left, right) => right.dial.length - left.dial.length);

export function phoneCountryByIso(iso: string): PhoneCountry | null {
  return countriesByIso.get(iso) ?? null;
}

export function phoneNationalLimit(iso: string): number {
  const country = phoneCountryByIso(iso);
  if (!country) {
    return 15;
  }

  if (country.iso === "ES") {
    return 9;
  }

  return Math.min(14, 15 - country.dial.length);
}

export function formatNationalPhone(iso: string, national: string): string {
  const digits = national.replace(/\D/g, "");
  const groups = iso === "US" || iso === "CA" ? [3, 3, 4] : [3, 3, 3, 3, 2];
  const parts: string[] = [];
  let index = 0;

  for (const size of groups) {
    if (index >= digits.length) {
      break;
    }

    parts.push(digits.slice(index, index + size));
    index += size;
  }

  if (index < digits.length) {
    parts.push(digits.slice(index));
  }

  return parts.join("-");
}

export function isValidPhoneNational(iso: string, national: string): boolean {
  const country = phoneCountryByIso(iso);
  if (!country || !/^\d+$/.test(national)) {
    return false;
  }

  if (country.iso === "ES") {
    return /^[6-9]\d{8}$/.test(national);
  }

  const limit = phoneNationalLimit(iso);
  return national.length >= 6 && national.length <= limit;
}

export function storedPhone(iso: string, national: string): string {
  const country = phoneCountryByIso(iso);
  if (!country) {
    return national;
  }

  return `${country.iso}:+${country.dial}${national}`;
}

export function readStoredPhone(stored: string | null): { iso: string; national: string } {
  if (!stored) {
    return { iso: "ES", national: "" };
  }

  const tagged = /^([A-Z]{2}):\+(\d+)$/.exec(stored);
  if (tagged) {
    const iso = tagged[1] ?? "";
    const digits = tagged[2] ?? "";
    const country = phoneCountryByIso(iso);
    if (country && digits.startsWith(country.dial)) {
      return { iso: country.iso, national: digits.slice(country.dial.length) };
    }
  }

  const digits = stored.replace(/\D/g, "");
  const match = countriesByDialLength.find((country) => digits.startsWith(country.dial));
  if (!match) {
    return { iso: "ES", national: digits.slice(0, 9) };
  }

  return { iso: match.iso, national: digits.slice(match.dial.length) };
}
