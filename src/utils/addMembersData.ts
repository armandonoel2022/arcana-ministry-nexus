
import { supabase } from '@/integrations/supabase/client';

// Función para convertir fecha de nacimiento del formato "22 de mayo de 1973" a formato ISO
const convertBirthDate = (dateString: string): string | null => {
  if (!dateString || dateString === '-') return null;
  
  const months: { [key: string]: string } = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  
  const regex = /(\d{1,2}) de (\w+) de (\d{4})/;
  const match = dateString.match(regex);
  
  if (match) {
    const [, day, monthName, year] = match;
    const month = months[monthName.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }
  
  return null;
};

// Función para mapear cargo a enum value
const mapCargoToEnum = (cargo: string): string => {
  const cargoMap: { [key: string]: string } = {
    'Pastor': 'pastor',
    'Pastora': 'pastora',
    'Director Musical': 'director_musical',
    'Programación': 'encargado_programacion',
    'Encargada programación Congresos y Retiro anual': 'encargado_programacion',
    'Encargada de Programación': 'encargado_programacion',
    'Encargada de Interseción': 'encargado_intercesion',
    'Líder de Alabanza': 'director_alabanza',
    'Director de Alabanza': 'director_alabanza',
    'Directora de Alabanza': 'directora_alabanza',
    'Corista': 'corista',
    'Secretaria': 'secretaria',
    'Directora de Danza': 'directora_danza',
    'Danzarina': 'danzarina',
    'Ing. de audio / Baterísta': 'sonidista',
    'Sonidista / Bajista': 'sonidista',
    'Baterísta': 'musico',
    'Pianista': 'musico',
    'Percusionista': 'musico',
    'Trombosista': 'musico',
    'Guitarrista': 'musico',
    'Director de Multimedia': 'director_multimedia',
    'Encargado de Luces y proyección': 'encargado_luces',
    'Director de Alabanza / Voz en off': 'director_alabanza',
    'Diseño': 'disenador',
    'Asistente de proyección': 'encargado_proyeccion',
    'Proyección': 'encargado_proyeccion',
    'Video': 'camarografo',
    'Luces': 'encargado_luces'
  };
  
  return cargoMap[cargo] || 'corista';
};

// Función para mapear grupo a enum value
const mapGrupoToEnum = (grupo: string): string | null => {
  if (!grupo || grupo === '-') return null;
  
  const grupoMap: { [key: string]: string } = {
    'Directiva': 'directiva',
    'Músicos': 'musicos',
    'Grupo de Aleida': 'Grupo de Aleida',
    'Grupo de Keyla': 'Grupo de Keyla',
    'Grupo de Massy': 'Grupo de Massy',
    'ADN Juvenil': 'ADN Juvenil',
    'Suplente': 'Suplente',
    'Ministerio de Danza Adonai': 'Danza',
    'Departamento de Sonido': 'Sonido',
    'Departamento de Multimedia': 'Multimedia'
  };
  
  return grupoMap[grupo] || null;
};

// Datos de los miembros
export const membersData = [
  {
    nombres: "Roosevelt",
    apellidos: "Martinez",
    cargo: "Pastor",
    grupo: "Directiva",
    persona_reporte: "Pastor Freddy A. Martinez",
    voz_instrumento: "Tenor",
    fecha_nacimiento: "22 de mayo de 1973",
    telefono: "829-597-0051",
    celular: "809-440-3587",
    email: "rooseveltmartinez_29@yahoo.com",
    direccion: "C/ María Teresa de Calcuta, Edif. Laura Victoria, Res. Amanda II, Santo Domingo Este",
    contacto_emergencia: "Mary Acosta de Martinez 809-440-3588",
    tipo_sangre: "O+"
  },
  {
    nombres: "Mary",
    apellidos: "Acosta de Martinez",
    cargo: "Pastora",
    grupo: "Directiva",
    persona_reporte: "Pastor Freddy A. Martinez",
    voz_instrumento: "-",
    fecha_nacimiento: "25 de abril de 1971",
    telefono: "829-597-0051",
    celular: "809-440-3588",
    email: "-",
    direccion: "C/ María Teresa de Calcuta, Edif. Laura Victoria, Res. Amanda II, Santo Domingo Este",
    contacto_emergencia: "Roosevelt Martinez 809-440-3587",
    tipo_sangre: "A+"
  },
  {
    nombres: "Rey David",
    apellidos: "Santana Castillo",
    cargo: "Director Musical",
    grupo: "Músicos",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Bajo",
    fecha_nacimiento: "20 de junio de 1983",
    telefono: "809-595-7917",
    celular: "829-579-7202",
    email: "king_david77@hotmail.com",
    direccion: "C/ 4ta Manz. E #6, Res. Hamarap, Villa Faro, Santo Domingo Este",
    contacto_emergencia: "Lorena Pacheco 829-574-2861",
    tipo_sangre: "O+"
  },
  {
    nombres: "Carmery",
    apellidos: "Martinez Rosa",
    cargo: "Programación",
    grupo: "Directiva",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "-",
    fecha_nacimiento: "27 de marzo de 1985",
    telefono: "809-594-4854",
    celular: "829-712-4954",
    email: "carmerymartinez@gmail.com",
    direccion: "C/ Activo 20-30, Res. Priscila II, Edif. 4, Apto. 1-B, Alma Rosa II, Santo Domingo Este",
    contacto_emergencia: "Luís Marte 829-712-4954",
    tipo_sangre: "O+"
  },
  {
    nombres: "Aleida",
    apellidos: "Batista",
    cargo: "Encargada de Programación",
    grupo: "Grupo de Aleida",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Soprano",
    fecha_nacimiento: "8 de abril de 1957",
    telefono: "809-565-3371",
    celular: "809-993-2354",
    email: "aleidag_batista@hotmail.com",
    direccion: "C/ Presidente González #8, Ens. Naco Santo Domingo, Distrito Nacional",
    contacto_emergencia: "Abel Marte Batista",
    tipo_sangre: "A+"
  },
  {
    nombres: "Arisleida",
    apellidos: "Liriano",
    cargo: "Encargada de Interseción",
    grupo: "-",
    persona_reporte: "Pastora Mary Acosta",
    voz_instrumento: "-",
    fecha_nacimiento: "14 de diciembre de 1969",
    telefono: "809-273-3459",
    celular: "809-855-3474",
    email: "arispayeroliriano@gmail.com",
    direccion: "C/ José Peguero #14 (altos), Cancino II, Santo Domingo Este",
    contacto_emergencia: "Jesús Payero 809-762-3816",
    tipo_sangre: "B+"
  },
  {
    nombres: "Patricia",
    apellidos: "Mauricio",
    cargo: "Líder de Alabanza",
    grupo: "Grupo de Aleida",
    persona_reporte: "Aleida Batista",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "27 de febrero de 1987",
    telefono: "829-687-5820",
    celular: "809-931-2632",
    email: "patriciamauriciopaniagua@gmail.com",
    direccion: "Av. Independencia #608, Zona Universitaria Santo Domingo, Distrito Nacional",
    contacto_emergencia: "Ruddy Mauricio 829-633-2637",
    tipo_sangre: ""
  },
  {
    nombres: "Denny Leticia",
    apellidos: "Castillo Berroa",
    cargo: "Líder de Alabanza",
    grupo: "Grupo de Aleida",
    persona_reporte: "Aleida Batista",
    voz_instrumento: "Soprano",
    fecha_nacimiento: "1 de noviembre de 1987",
    telefono: "809-621-7000",
    celular: "809-880-7730",
    email: "jeracastillo01@outlook.com",
    direccion: "C/ Marcos del Rosario #126, Los Mina, Santo Domingo Este",
    contacto_emergencia: "Gladys de Jesús 829-891-6409",
    tipo_sangre: "O-"
  },
  {
    nombres: "Fior Daliza",
    apellidos: "Paniagua",
    cargo: "Corista",
    grupo: "Grupo de Aleida",
    persona_reporte: "Aleida Batista",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "23 de abril de 1964",
    telefono: "809-388-2136",
    celular: "829-273-0716",
    email: "fiordalizapaniagua01@hotmail.com",
    direccion: "C/ Gardenia #21. María Trinidad Sánchez Los Minas",
    contacto_emergencia: "Ruddy Mauricio 829-633-2637",
    tipo_sangre: ""
  },
  {
    nombres: "Jesús",
    apellidos: "Payero",
    cargo: "Corista",
    grupo: "Grupo de Aleida",
    persona_reporte: "Aleida Batista",
    voz_instrumento: "Tenor",
    fecha_nacimiento: "5 de febrero de 1969",
    telefono: "809-273-3459",
    celular: "809-762-3816",
    email: "jesuspayerosp@hotmail.com",
    direccion: "C/ José Peguero #14 (altos), Cancino II, Santo Domingo Este",
    contacto_emergencia: "Aris Leyda Liriano 809-855-3474",
    tipo_sangre: "O+"
  },
  {
    nombres: "Keyla",
    apellidos: "Medrano",
    cargo: "Líder de Alabanza",
    grupo: "Grupo de Keyla",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Soprano",
    fecha_nacimiento: "19 de junio de 1974",
    telefono: "-",
    celular: "809-714-2148",
    email: "-",
    direccion: "C/ Paraíso, Apto B10, Urb. Los Cerros, Sabana Perdida",
    contacto_emergencia: "Jessica Medrano",
    tipo_sangre: ""
  },
  {
    nombres: "Sugey",
    apellidos: "González",
    cargo: "Corista",
    grupo: "Grupo de Keyla",
    persona_reporte: "Keyla Medrano",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "21 de enero de 1979",
    telefono: "809-234-1111",
    celular: "809-993-2612",
    email: "sukigaro@hotmail.com",
    direccion: "C/ Proyecto #6, Apto. 6D, Urb. Moisés Los Mina, Santo Domingo Este",
    contacto_emergencia: "Denny Santana 809-842-2856",
    tipo_sangre: "B+"
  },
  {
    nombres: "Lorena",
    apellidos: "Pacheco",
    cargo: "Corista",
    grupo: "Grupo de Keyla",
    persona_reporte: "Keyla Medrano",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "11 de agosto de 1984",
    telefono: "809-595-7917",
    celular: "829-574-2861",
    email: "lorepache1120@gmail.com",
    direccion: "C/ 4ta Manz. E #6, Res. Hamarap, Villa Faro, Santo Domingo Este",
    contacto_emergencia: "David Santana 829-579-7202",
    tipo_sangre: "O+"
  },
  {
    nombres: "Arizonni",
    apellidos: "Liriano",
    cargo: "Corista",
    grupo: "Grupo de Keyla",
    persona_reporte: "Keyla Medrano",
    voz_instrumento: "Bajo",
    fecha_nacimiento: "4 de agosto de 1977",
    telefono: "809-593-2838",
    celular: "829-936-0980",
    email: "thearizonni24@hotmail.com",
    direccion: "C/ La Gallera #14A, Sector Los Trinitarios, Santo Domingo Este",
    contacto_emergencia: "Paola Arias 829-936-0981",
    tipo_sangre: "O+"
  },
  {
    nombres: "Carolina",
    apellidos: "Santana",
    cargo: "Secretaria",
    grupo: "Grupo de Keyla",
    persona_reporte: "Keyla Medrano",
    voz_instrumento: "Soprano",
    fecha_nacimiento: "26 de noviembre de 1979",
    telefono: "809-788-7892",
    celular: "829-387-1070",
    email: "carol7154@hotmail.com",
    direccion: "C/ Resp. Priscilla 2 Alma Rosa II, Santo Domingo Este",
    contacto_emergencia: "Abel Marte Batista 829-619-9786",
    tipo_sangre: "O-"
  },
  {
    nombres: "Jissell",
    apellidos: "Mauricio",
    cargo: "Corista",
    grupo: "Grupo de Massy",
    persona_reporte: "Damaris Castillo",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "28 de septiembre de 1984",
    telefono: "809-388-3385",
    celular: "809-994-1033",
    email: "jiselmauricio@hotmail.com",
    direccion: "C/ Verano #13, Urb. María Trinidad Sánchez, Los Mina, Santo Domingo Este",
    contacto_emergencia: "Ambiorix 809-850-5136",
    tipo_sangre: "B+"
  },
  {
    nombres: "Guarionex",
    apellidos: "García Cabrera",
    cargo: "Director de Alabanza",
    grupo: "Grupo de Massy",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Tenor",
    fecha_nacimiento: "30 de noviembre de 1982",
    telefono: "-",
    celular: "809-873-6719",
    email: "guarionexcine@gmail.com",
    direccion: "C/ 16 #44, Lotes y Servicios, Sabana Perdida",
    contacto_emergencia: "Guaro García 809-821-1957",
    tipo_sangre: "B+"
  },
  {
    nombres: "María del Amparo",
    apellidos: "Pérez Santana",
    cargo: "Directora de Alabanza",
    grupo: "Grupo de Massy",
    persona_reporte: "Damaris Castillo",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "15 de septiembre de 1991",
    telefono: "-",
    celular: "829-524-0585",
    email: "santanamariam54@gmail.com",
    direccion: "C/ 16 #44, Lotes y Servicios, Sabana Perdida",
    contacto_emergencia: "Rode Santana 809-388-4015",
    tipo_sangre: "O+"
  },
  {
    nombres: "Rode Esther",
    apellidos: "Santana",
    cargo: "Corista",
    grupo: "Grupo de Massy",
    persona_reporte: "Damaris Castillo",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "10 de septiembre de 1972",
    telefono: "809-388-4015",
    celular: "809-438-6715",
    email: "rodeesther1972@gmail.com",
    direccion: "C/ A #27, Res Moisés Los Mina, Santo Domingo Este",
    contacto_emergencia: "Gerson Sánchez 829-933-9890",
    tipo_sangre: "O+"
  },
  {
    nombres: "Damaris",
    apellidos: "Castillo",
    cargo: "Directora de Alabanza",
    grupo: "Grupo de Massy",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Soprano",
    fecha_nacimiento: "27 de septiembre de 1971",
    telefono: "809-540-5056",
    celular: "829-343-0241",
    email: "damaris.cj@hotmail.com",
    direccion: "C/ Agustín Lara #69, Edif. Paseo del Sol, Apto. 501 Ens. Serrallés, Distrito Nacional",
    contacto_emergencia: "Victor Luna 809-497-5448",
    tipo_sangre: "O+"
  },
  {
    nombres: "Roosemary",
    apellidos: "Martinez Acosta",
    cargo: "Directora de Alabanza",
    grupo: "ADN Juvenil",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "7 de febrero de 1997",
    telefono: "829-597-0051",
    celular: "829-768-2907",
    email: "",
    direccion: "C/ María Teresa de Calcuta, Edif. Laura Victoria, Res. Amanda II, Santo Domingo Este",
    contacto_emergencia: "Roosevelt Martinez 809-440-3587",
    tipo_sangre: ""
  },
  {
    nombres: "Bryan",
    apellidos: "Martinez Acosta",
    cargo: "Director de Alabanza",
    grupo: "ADN Juvenil",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Tenor",
    fecha_nacimiento: "29 de julio de 1996",
    telefono: "829-597-0051",
    celular: "829-442-3565",
    email: "bryanmartinez_29@hotmail.com",
    direccion: "C/ María Teresa de Calcuta, Edif. Laura Victoria, Res. Amanda II, Santo Domingo Este",
    contacto_emergencia: "Roosevelt Martinez 809-440-3587",
    tipo_sangre: "O+"
  },
  {
    nombres: "Yolanda",
    apellidos: "Arias de León",
    cargo: "Corista",
    grupo: "ADN Juvenil",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "28 de junio de 1994",
    telefono: "809-388-1596",
    celular: "809-433-0628",
    email: "yoliearias.94@gmail.com",
    direccion: "C/ Las Gardenias #23, María Trinidad Sánchez, Los Mina, Santo Domingo Este",
    contacto_emergencia: "Rafaél Arias 809-449-0095",
    tipo_sangre: "O+"
  },
  {
    nombres: "Leslie Marie",
    apellidos: "Morales Paniagua",
    cargo: "Corista",
    grupo: "ADN Juvenil",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Soprano",
    fecha_nacimiento: "10 de julio de 1995",
    telefono: "809-388-1596",
    celular: "849-861-7987",
    email: "l.moralespaniagua@gmail.com",
    direccion: "C/ Las Gardenias #23, María Trinidad Sánchez, Los Mina, Santo Domingo Este",
    contacto_emergencia: "Fior Daliza Paniagua 829-629-0522",
    tipo_sangre: "B+"
  },
  {
    nombres: "Denny",
    apellidos: "Santana",
    cargo: "Director de Alabanza",
    grupo: "Suplente",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Bajo",
    fecha_nacimiento: "31 de marzo de 1980",
    telefono: "809-234-1111",
    celular: "809-842-4856",
    email: "dennyalbertosantana@hotmail.com",
    direccion: "C/ Proyecto #6, Apto. 6D, Urb. Moisés Los Mina, Santo Domingo Este",
    contacto_emergencia: "Sugey González 809-993-2612",
    tipo_sangre: "B+"
  },
  {
    nombres: "Nicolás",
    apellidos: "Peralta",
    cargo: "Director de Alabanza / Voz en off",
    grupo: "Suplente",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Tenor",
    fecha_nacimiento: "2 de septiembre de 1981",
    telefono: "809-234-3252",
    celular: "829-764-1152",
    email: "nicolasperalta@gmail.com",
    direccion: "",
    contacto_emergencia: "Eva Barreiro 849-357-8199",
    tipo_sangre: "O+"
  },
  {
    nombres: "Rosely",
    apellidos: "Montero Moreta",
    cargo: "Corista",
    grupo: "Suplente",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Contralto",
    fecha_nacimiento: "8 de enero de 1982",
    telefono: "-",
    celular: "809-216-0819",
    email: "monterorosely@gmail.com",
    direccion: "Manz 4693, Edif. 2, Apto. 4C Invivienda, Santo Domingo Este",
    contacto_emergencia: "José Miguel de los Santos",
    tipo_sangre: "O+"
  },
  {
    nombres: "Ruth Esther",
    apellidos: "Santana",
    cargo: "Directora de Danza",
    grupo: "Ministerio de Danza Adonai",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Danza",
    fecha_nacimiento: "8 de septiembre de 1987",
    telefono: "",
    celular: "849-212-8259",
    email: "ruthsantana@outlook.com",
    direccion: "C/ Caonabo #7 Urb. Los Trinitarios II, Santo Domingo Este",
    contacto_emergencia: "Juan Aposto Santana 809-266-4932",
    tipo_sangre: ""
  },
  {
    nombres: "Katherine",
    apellidos: "Ortiz",
    cargo: "Danzarina",
    grupo: "Ministerio de Danza Adonai",
    persona_reporte: "Ruth Santana",
    voz_instrumento: "Danza",
    fecha_nacimiento: "9 de septiembre de 1987",
    telefono: "809-598-6784",
    celular: "829-882-0187",
    email: "katherineortiz2772@hotmail.com",
    direccion: "C/ 1#7, Los Mina, Santo Domingo Este",
    contacto_emergencia: "Ana Ortiz 829-562-0312",
    tipo_sangre: "O+"
  },
  {
    nombres: "Laura",
    apellidos: "Sánchez Santana",
    cargo: "Danzarina",
    grupo: "Ministerio de Danza Adonai",
    persona_reporte: "Ruth Santana",
    voz_instrumento: "Danza",
    fecha_nacimiento: "",
    telefono: "809-388-4015",
    celular: "849-915-9160",
    email: "",
    direccion: "C/ A #27, Res Moisés Los Mina, Santo Domingo Este",
    contacto_emergencia: "Gerson Sánchez 829-933-9890",
    tipo_sangre: ""
  },
  {
    nombres: "Stephany",
    apellidos: "Lucero Cabrera",
    cargo: "Danzarina",
    grupo: "Ministerio de Danza Adonai",
    persona_reporte: "Ruth Santana",
    voz_instrumento: "Danza",
    fecha_nacimiento: "10 de diciembre de 1993",
    telefono: "849-296-0340",
    celular: "829-871-6453",
    email: "lucero040910@gmail.com",
    direccion: "Av. Marcos del Rosario #77, Los Mina, Santo Domingo Este",
    contacto_emergencia: "Junior 829-699-6453",
    tipo_sangre: "O+"
  },
  {
    nombres: "Jessica",
    apellidos: "Medrano",
    cargo: "Danzarina",
    grupo: "Ministerio de Danza Adonai",
    persona_reporte: "Ruth Santana",
    voz_instrumento: "Danza",
    fecha_nacimiento: "24 de febrero de 2000",
    telefono: "-",
    celular: "809-714-2148",
    email: "-",
    direccion: "C/ Paraíso, Apto B10, Urb. Los Cerros, Sabana Perdida",
    contacto_emergencia: "Keyla Medrano",
    tipo_sangre: ""
  },
  {
    nombres: "Abraham",
    apellidos: "Marte",
    cargo: "Ing. de audio / Baterísta",
    grupo: "Departamento de Sonido",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Consola / Batería",
    fecha_nacimiento: "13 de junio de 1985",
    telefono: "",
    celular: "849-884-7393",
    email: "abraham.enrique.marte@gmail.com",
    direccion: "C/ Presidente González #8, Ens. Naco Santo Domingo, Distrito Nacional",
    contacto_emergencia: "Abel Marte Batista",
    tipo_sangre: "AB+"
  },
  {
    nombres: "Benjamín",
    apellidos: "Martinez",
    cargo: "Sonidista / Bajista",
    grupo: "Departamento de Sonido",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Consola / Bajo",
    fecha_nacimiento: "13 de octubre de 2000",
    telefono: "809-598-6437",
    celular: "849-330-8391",
    email: "benjaminmahd@gmail.com",
    direccion: "C/ 15 #64, Ens. Ozama, Santo Domingo Este",
    contacto_emergencia: "Betania de la Cruz 829-742-5989",
    tipo_sangre: ""
  },
  {
    nombres: "Jatniel",
    apellidos: "Martinez Portes",
    cargo: "Baterísta",
    grupo: "Músicos",
    persona_reporte: "David Santana",
    voz_instrumento: "Batería",
    fecha_nacimiento: "1 de marzo de 1995",
    telefono: "829-547-7155",
    celular: "829-696-6653",
    email: "jatnielmartinezportes@gmail.com",
    direccion: "C/ 2da, #21, Urb. Brisas del Este, Lotes y Servicios, Sabana Perdida, Santo Domingo Norte",
    contacto_emergencia: "Eilyn Martinez 829-558-8422",
    tipo_sangre: "A+"
  },
  {
    nombres: "Orlando",
    apellidos: "Santana",
    cargo: "Pianista",
    grupo: "Músicos",
    persona_reporte: "David Santana",
    voz_instrumento: "Piano",
    fecha_nacimiento: "19 de abril de 1986",
    telefono: "809-595-7917",
    celular: "809-834-3213",
    email: "orlan2sc@hotmail.com",
    direccion: "C/ 4ta Manz. E #6, Res. Hamarap, Villa Faro, Santo Domingo Este",
    contacto_emergencia: "Rey David Santana Padre 809-840-3430",
    tipo_sangre: "O+"
  },
  {
    nombres: "Eliezer",
    apellidos: "Leyba Ortiz",
    cargo: "Percusionista",
    grupo: "Músicos",
    persona_reporte: "David Santana",
    voz_instrumento: "Congas",
    fecha_nacimiento: "11 de marzo de 1987",
    telefono: "809-388-7350",
    celular: "809-519-7350",
    email: "elatletagod@hotmail.com",
    direccion: "C/ Guarocuya #32, Casa 4A, Ensanche Quisqueya, Distrito Nacional",
    contacto_emergencia: "Fausto Leyba 809-250-3740",
    tipo_sangre: "O+"
  },
  {
    nombres: "Joel",
    apellidos: "Flores",
    cargo: "Percusionista",
    grupo: "Músicos",
    persona_reporte: "David Santana",
    voz_instrumento: "Batería",
    fecha_nacimiento: "29 de agosto de 1981",
    telefono: "829-687-5820",
    celular: "829-539-3838",
    email: "cjoel.floresr@gmail.com",
    direccion: "Av. Independencia #608, Zona Universitaria Santo Domingo, Distrito Nacional",
    contacto_emergencia: "Carlos Flores 809-390-5872",
    tipo_sangre: "O+"
  },
  {
    nombres: "Carmen",
    apellidos: "Hernández",
    cargo: "Trombosista",
    grupo: "Músicos",
    persona_reporte: "David Santana",
    voz_instrumento: "Trombón",
    fecha_nacimiento: "21 de octubre de 1949",
    telefono: "-",
    celular: "809-371-1974",
    email: "-",
    direccion: "C/ B #12, Res. Moisés Los Mina, Santo Domingo Este",
    contacto_emergencia: "Nicolás Peralta 829-716-5473",
    tipo_sangre: "O+"
  },
  {
    nombres: "Alberto",
    apellidos: "Medina",
    cargo: "Guitarrista",
    grupo: "Músicos",
    persona_reporte: "David Santana",
    voz_instrumento: "Guitarra acústica",
    fecha_nacimiento: "10 de junio de 1981",
    telefono: "809-483-5277",
    celular: "809-880-7535",
    email: "amedinaj@gmail.com",
    direccion: "Manz D #4, Apto W-302, Res. Las Terrazas, Lucerna, Santo Domingo Este",
    contacto_emergencia: "Ana Victoria Robles 829-912-2112",
    tipo_sangre: "O+"
  },
  {
    nombres: "Gerson Daniel",
    apellidos: "Sánchez Santana",
    cargo: "Guitarrista",
    grupo: "Músicos",
    persona_reporte: "David Santana",
    voz_instrumento: "Guitarra eléctrica",
    fecha_nacimiento: "15 de septiembre de 1996",
    telefono: "809-388-4015",
    celular: "829-936-6689",
    email: "danyelchon@hotmail.com",
    direccion: "C/ A #27, Res Moisés Los Mina, Santo Domingo Este",
    contacto_emergencia: "Gerson Sánchez 829-933-9890",
    tipo_sangre: "A+"
  },
  {
    nombres: "Michelle",
    apellidos: "Martinez",
    cargo: "Guitarrista",
    grupo: "Músicos",
    persona_reporte: "David Santana",
    voz_instrumento: "Guitarra eléctrica",
    fecha_nacimiento: "12 de agosto de 1996",
    telefono: "809-598-6437",
    celular: "809-423-6437",
    email: "michelmartinezi278@gmail.com",
    direccion: "C/ 15 #64, Ens. Ozama, Santo Domingo Este",
    contacto_emergencia: "Betania de la Cruz 829-742-5989",
    tipo_sangre: "O+"
  },
  {
    nombres: "Luís",
    apellidos: "Marte",
    cargo: "Director de Multimedia",
    grupo: "Departamento de Multimedia",
    persona_reporte: "Pastor Roosevelt Martinez",
    voz_instrumento: "Audiovisuales",
    fecha_nacimiento: "23 de junio de 1984",
    telefono: "809-594-4854",
    celular: "829-712-4955",
    email: "lmarte23@gmail.com",
    direccion: "C/ Activo 20-30, Res. Priscila II, Edif. 4, Apto. 1-B, Alma Rosa II, Santo Domingo Este",
    contacto_emergencia: "Carmery Martinez 829-846-3361",
    tipo_sangre: "AB+"
  },
  {
    nombres: "Randol",
    apellidos: "Frías",
    cargo: "Encargado de Luces y proyección",
    grupo: "Departamento de Multimedia",
    persona_reporte: "Luís Marte",
    voz_instrumento: "Audiovisuales",
    fecha_nacimiento: "16 de noviembre de 1988",
    telefono: "809-797-1083",
    celular: "849-607-0148",
    email: "randol.frias@gmail.com",
    direccion: "C/ Parque del Este, Manz. 48, Edif. D, Apart. 402, Urb. Prados de San Luis, Santo Domingo Este",
    contacto_emergencia: "Altagracia Taveras 849-352-7626",
    tipo_sangre: "O+"
  },
  {
    nombres: "Armando",
    apellidos: "Noel",
    cargo: "Director de Alabanza / Voz en off",
    grupo: "Departamento de Multimedia",
    persona_reporte: "Luís Marte",
    voz_instrumento: "Tenor",
    fecha_nacimiento: "15 de agosto de 1985",
    telefono: "809-699-4513",
    celular: "829-802-6640",
    email: "armandonoel@outlook.com",
    direccion: "C/ Caonabo #7 Urb. Los Trinitarios II, Santo Domingo Este",
    contacto_emergencia: "Wilfrido Noel 809-768-2197",
    tipo_sangre: "A+"
  },
  {
    nombres: "Kioko",
    apellidos: "Murata",
    cargo: "Diseño",
    grupo: "Departamento de Multimedia",
    persona_reporte: "Luís Marte",
    voz_instrumento: "Audiovisuales",
    fecha_nacimiento: "14 de septiembre de 1988",
    telefono: "-",
    celular: "809-993-4214",
    email: "kyokomurata1409@gmail.com",
    direccion: "C/ Francisco Prats Ramírez #106, Ens. Piantini, Distrito Nacional",
    contacto_emergencia: "Randol Frías 849-607-0148",
    tipo_sangre: "AB+"
  },
  {
    nombres: "Katherine",
    apellidos: "Lorenzo",
    cargo: "Asistente de proyección",
    grupo: "Departamento de Multimedia",
    persona_reporte: "Luís Marte",
    voz_instrumento: "Audiovisuales",
    fecha_nacimiento: "28 de noviembre de 1994",
    telefono: "809-593-9770",
    celular: "829-631-4744",
    email: "klorenzo1128@gmail.com",
    direccion: "C/ Virgilio Mainardi Reyna, Ens. Alma Rosa Santo Domingo Este",
    contacto_emergencia: "Meris Rosario 849-455-0673",
    tipo_sangre: "O+"
  },
  {
    nombres: "Wilton",
    apellidos: "Gómez Portes",
    cargo: "Proyección",
    grupo: "Departamento de Multimedia",
    persona_reporte: "Luís Marte",
    voz_instrumento: "Audiovisuales",
    fecha_nacimiento: "14 de noviembre de 1995",
    telefono: "809-598-6051",
    celular: "849-624-8149",
    email: "wilton-gomez@hotmail.com",
    direccion: "C/ Fray Pedro de Córdoba #06, Los Mina, Santo Domingo Este",
    contacto_emergencia: "Marisela de Medrano 809-321-2915",
    tipo_sangre: "O+"
  },
  {
    nombres: "Engely",
    apellidos: "Santana",
    cargo: "Diseño",
    grupo: "Departamento de Multimedia",
    persona_reporte: "Luís Marte",
    voz_instrumento: "Audiovisuales",
    fecha_nacimiento: "16 de noviembre de 1991",
    telefono: "809-234-2373",
    celular: "849-281-0083",
    email: "engeli.santana@gmail.com",
    direccion: "C/ Altagracia #53, Los Tres Brazos, Santo Domingo Este",
    contacto_emergencia: "Padre 809-684-5793",
    tipo_sangre: "O+"
  },
  {
    nombres: "Iham",
    apellidos: "Rodriguez",
    cargo: "Video",
    grupo: "Departamento de Multimedia",
    persona_reporte: "Luís Marte",
    voz_instrumento: "Audiovisuales",
    fecha_nacimiento: "29 de junio de 1993",
    telefono: "829-602-2924",
    celular: "829-602-2924",
    email: "ihamrod@gmal.com",
    direccion: "C/Rosa Duarte #46,Los Minas ,Santo Domingo Este",
    contacto_emergencia: "Reyna Franco 829-308-6894",
    tipo_sangre: "O+"
  },
  {
    nombres: "Junior",
    apellidos: "Garo",
    cargo: "Luces",
    grupo: "Departamento de Multimedia",
    persona_reporte: "Luís Marte",
    voz_instrumento: "Audiovisuales",
    fecha_nacimiento: "7 de febrero de 1986",
    telefono: "-",
    celular: "829-506-4739",
    email: "juniorgaro44@gmail.com",
    direccion: "C/ Manacia #32, 1/2 Res. Acasia, Km 13 1/2 Carretera Mella, Santo Domingo Este",
    contacto_emergencia: "809-758-9293",
    tipo_sangre: "B+"
  }
];

// Función para insertar todos los miembros
export const insertAllMembers = async () => {
  try {
    console.log('Iniciando inserción de miembros...');
    
    const processedMembers = membersData.map(member => ({
      nombres: member.nombres,
      apellidos: member.apellidos,
      cargo: mapCargoToEnum(member.cargo),
      grupo: mapGrupoToEnum(member.grupo),
      persona_reporte: member.persona_reporte || null,
      voz_instrumento: member.voz_instrumento && member.voz_instrumento !== '-' ? member.voz_instrumento : null,
      fecha_nacimiento: convertBirthDate(member.fecha_nacimiento),
      telefono: member.telefono && member.telefono !== '-' ? member.telefono : null,
      celular: member.celular && member.celular !== '-' ? member.celular : null,
      email: member.email && member.email !== '-' && member.email !== '' ? member.email : null,
      direccion: member.direccion || null,
      contacto_emergencia: member.contacto_emergencia || null,
      tipo_sangre: member.tipo_sangre && member.tipo_sangre !== '' && member.tipo_sangre !== '?' ? member.tipo_sangre : null,
      referencias: null,
      is_active: true
    }));

    console.log('Procesando', processedMembers.length, 'miembros...');

    const { data, error } = await supabase
      .from('members')
      .insert(processedMembers)
      .select();

    if (error) {
      console.error('Error insertando miembros:', error);
      throw error;
    }

    console.log('Miembros insertados exitosamente:', data?.length);
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Error en la inserción:', error);
    return { success: false, error };
  }
};
