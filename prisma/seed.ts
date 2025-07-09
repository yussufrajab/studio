import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const institutions = [
    { id: 'inst_1', name: 'Ofisi ya Msajili wa Hazina' },
    { id: 'inst_2', name: 'Ofisi ya Mkuu wa Mkoa wa Kusini Unguja' },
    { id: 'inst_3', name: 'Wakala wa Vipimo Zanzibar' },
    { id: 'inst_4', name: 'WIZARA YA MAENDELEO YA JAMII,JINSIA,WAZEE NA WATOTO' },
    { id: 'inst_5', name: 'KAMISHENI YA UTUMISHI WA UMMA' },
    { id: 'inst_6', name: 'WAKALA WA SERIKALI MTANDAO (eGAZ)' },
    { id: 'inst_7', name: 'OFISI YA MKAGUZI MKUU WA NDANI WA SERIKALI' },
    { id: 'inst_8', name: 'Kamisheni ya Ardhi Zanzibar' },
    { id: 'inst_9', name: 'Ofisi ya Mhasibu Mkuu wa Serikali' },
    { id: 'inst_10', name: 'TAASISI YA NYARAKA NA KUMBUKUMBU' },
    { id: 'inst_11', name: 'AFISI YA RAISI KAZI, UCHUMI NA UWEKEZAJI' },
    { id: 'inst_12', name: 'KAMISHENI YA UTALII ZANZIBAR' },
    { id: 'inst_13', name: 'SEKRETARIETI YA AJIRA .' },
    { id: 'inst_14', name: 'TAASISI YA ELIMU YA ZANZIBAR' },
    { id: 'inst_15', name: 'KAMISHENI YA KUKABILIANA NA MAAFA ZANZIBAR' },
    { id: 'inst_16', name: 'WAKALA WA MAJENGO ZANZIBAR' },
    { id: 'inst_17', name: 'OFISI YA RAIS, FEDHA NA MIPANGO' },
    { id: 'inst_18', name: 'WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO' },
    { id: 'inst_19', name: 'WIZARA YA UJENZI MAWASILIANO NA UCHUKUZI' },
    { id: 'inst_20', name: 'OFISI YA MAKAMO WA KWANZA WA RAISI' },
    { id: 'inst_21', name: 'WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA' },
    { id: 'inst_22', name: 'SEKRETARIETI YA AJIRA' },
    { id: 'inst_23', name: 'OFISI YA RAIS, TAWALA ZA MIKOA, SERIKALI ZA MITAA NA IDARA MAALUMU ZA SMZ' },
    { id: 'inst_24', name: 'OFISI YA RAIS - KATIBA SHERIA UTUMISHI NA UTAWALA BORA' },
    { id: 'inst_25', name: 'WIZARA YA HABARI, VIJANA, UTAMADUNI NA MICHEZO' },
    { id: 'inst_26', name: 'TUME YA UCHAGUZI YA ZANZIBAR' },
    { id: 'inst_27', name: 'OFISI YA MAKAMO WA PILI WA RAISI' },
    { id: 'inst_28', name: 'WIZARA YA UCHUMI WA BULUU NA UVUVI' },
    { id: 'inst_29', name: 'OFISI YA MUFTI MKUU WA ZANZIBAR' },
    { id: 'inst_30', name: 'MAMLAKA YA KUZUIA RUSHWA NA UHUJUMU WA UCHUMI ZANZIBAR' },
    { id: 'inst_31', name: 'WIZARA YA ARDHI NA MAENDELEO YA MAKAAZI ZANZIBAR' },
    { id: 'inst_32', name: 'WIZARA YA UTALII NA MAMBO YA KALE' },
    { id: 'inst_33', name: 'OFISI YA RAIS - IKULU' },
    { id: 'inst_34', name: 'MAMLAKA YA KUDHIBITI NA KUPAMBANA NA DAWA ZA KULEVYA ZANZIBAR' },
    { id: 'inst_35', name: 'TUME YA MAADILI YA VIONGOZI WA UMMA' },
    { id: 'inst_36', name: 'TUME YA UTUMISHI SERIKALINI' },
    { id: 'inst_37', name: 'AFISI YA MKURUGENZI WA MASHTAKA' },
    { id: 'inst_38', name: 'AFISI YA MWANASHERIA MKUU' },
    { id: 'inst_39', name: 'WIZARA YA MAJI NISHATI NA MADINI' },
    { id: 'inst_40', name: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI' },
    { id: 'inst_41', name: 'WIZARA YA AFYA' }
];

async function main() {
    console.log('Seeding database...');
    for (const institution of institutions) {
        await db.institution.upsert({
            where: { name: institution.name },
            update: {},
            create: {
                id: institution.id,
                name: institution.name,
            },
        });
    }
    console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
