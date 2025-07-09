
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Loader2, FileDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';
import { isWithinInterval, isValid, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Pagination } from '@/components/shared/pagination';
import type { Institution } from '@/app/dashboard/admin/institutions/page';


// Augment jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}


const REPORT_TYPES = [
  { value: 'serviceExtension', label: 'Ripoti ya Nyongeza ya Utumishi (Service Extension)' },
  { value: 'compulsoryRetirement', label: 'Ripoti ya Kustaafu kwa Lazima (Compulsory Retirement)' },
  { value: 'voluntaryRetirement', label: 'Ripoti ya Kustaafu kwa Hiari (Voluntary Retirement)' },
  { value: 'illnessRetirement', label: 'Ripoti ya Kustaafu kwa Ugonjwa (Illness Retirement)' },
  { value: 'lwop', label: 'Ripoti ya Likizo Bila Malipo (Leave Without Pay)' },
  { value: 'promotion', label: 'Ripoti ya Kupandishwa Cheo (Promotion)' },
  { value: 'promotionExperience', label: 'Ripoti ya Kupandishwa Cheo kwa Uzoefu (Promotion due to Experience)' },
  { value: 'promotionEducation', label: 'Ripoti ya Kupandishwa Cheo kwa Maendeleo ya Elimu (Promotion due to Education Advancement)' },
  { value: 'terminationDismissal', label: 'Ripoti ya Kufukuzwa/Kuachishwa Kazi (Termination/Dismissal)' },
  { value: 'complaints', label: 'Ripoti ya Malalamiko (Complaints)' },
  { value: 'cadreChange', label: 'Ripoti ya Kubadilishwa Kada (Change of Cadre)' },
  { value: 'resignation', label: 'Ripoti ya Kuacha Kazi (Employee Resignation)' },
  { value: 'confirmation', label: 'Ripoti ya Kuthibitishwa Kazini (Confirmation)' },
  { value: 'contractual', label: 'Ripoti ya Ajira za Mikataba (Contractual Employment)' },
];

interface ReportOutput {
  data: any[];
  headers: string[];
  title: string;
  totals?: any; // For summary rows
  dataKeys?: string[]; // explicit data keys in order of headers
}

const MOCK_DATA_STORE: Record<string, () => ReportOutput> = {
  serviceExtension: () => ({
    title: 'Ripoti ya Nyongeza ya Utumishi',
    headers: ["S/N", "JINA", "WIZARA/TAASISI", "CHEO/WADHIFA", "M", "F", "T", "TAREHE YA KUANZA NYONGEZA", "TAREHE YA KUMALIZA MUDA WA NYONGEZA"],
    dataKeys: ["sn", "jina", "wizara", "cheo", "m", "f", "t", "tareheKuanza", "tareheKumaliza"],
    data: [
      { sn: 1, jina: 'HAMID KHALFAN ABDALLA', wizara: 'OFISI YA RAIS, FEDHA NA MIPANGO', cheo: 'DEREVA', m: 1, f: 0, t: 1, tareheKuanza: '1/7/2025', tareheKumaliza: '30/06/2026' },
      { sn: 2, jina: 'SUBIRA JUMA ABDALLA', wizara: 'OFISI YA MAKAMO WA KWANZA WA RAISI', cheo: 'KATIBU MAHASUSI', m: 0, f: 1, t: 1, tareheKuanza: '14/12/2024', tareheKumaliza: '13/12/2026' },
      { sn: 3, jina: 'SOMOE SAID MUSSA', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', cheo: 'AFISA ELIMU WILAYA YA KATI', m: 0, f: 1, t: 1, tareheKuanza: '1/2/2025', tareheKumaliza: '31/01/2027' },
    ],
    totals: { sn: 'JUMLA', wizara: '', cheo: '', m: 1, f: 2, t: 3 }
  }),
  compulsoryRetirement: () => ({
    title: 'Ripoti ya Kustaafu kwa Lazima',
    headers: ["S.NO.", "JINA", "WIZARA/TAASISI", "MALE", "FEMALE", "JUMLA", "CHEO", "TAREHE YA KUZALIWA", "TAREHE YA KUSTAAFU"],
    dataKeys: ["sno", "jina", "wizara", "m", "f", "jumla", "cheo", "trhKuzaliwa", "trhKustaafu"],
    data: [
      { sno: 1, jina: 'Khamis Mcha Machano', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', m: 1, f: 0, jumla: 1, cheo: 'Mwalimu', trhKuzaliwa: '1965', trhKustaafu: '30/06/2025' },
      { sno: 2, jina: 'Biubwa Said Seif', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', m: 0, f: 1, jumla: 1, cheo: 'Mwalimu', trhKuzaliwa: '1965', trhKustaafu: '30/06/2025' },
      { sno: 3, jina: 'Khamis Ali Makame', wizara: 'Ofisi ya Mkuu wa Mkoa wa Kusini Unguja', m: 1, f: 0, jumla: 1, cheo: 'Tarishi', trhKuzaliwa: '15/06/1965', trhKustaafu: '14/06/2025' },
    ],
    totals: { sno: 'JUMLA', wizara: '', m: 2, f: 1, jumla: 3 }
  }),
  voluntaryRetirement: () => ({
    title: 'Ripoti ya Kustaafu kwa Hiari',
    headers: ["S/N", "JINA", "WIZARA/TAASISI", "CHEO/WADHIFA", "MALE", "FEMALE", "JUMLA", "TAREHE YA KUZALIWA", "UMRI"],
    dataKeys: ["sn", "jina", "wizara", "cheo", "m", "f", "jumla", "trhKuzaliwa", "umri"],
    data: [
        { sn: 1, jina: 'Zahran Ali Hamad', wizara: 'WIZARA YA AFYA', cheo: 'Mfamasia', m: 1, f: 0, jumla: 1, trhKuzaliwa: '9/2/1970', umri: 55 },
        { sn: 2, jina: 'OMAR SAID OMAR', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', cheo: 'Mwalimu', m: 1, f: 0, jumla: 1, trhKuzaliwa: '26/06/1966', umri: 58 },
        { sn: 3, jina: 'ASHA KHAMIS MWINSHEHE', wizara: 'WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA', cheo: 'Afisa viwanda', m: 0, f: 1, jumla: 1, trhKuzaliwa: '30/05/1966', umri: 57 },
    ],
    totals: { sn: 'JUMLA', cheo: '', m: 2, f: 1, jumla: 3 }
  }),
  illnessRetirement: () => ({
    title: 'Ripoti ya Kustaafu kwa Ugonjwa',
    headers: ["S/N", "TAREHE YA KUSTAAFISHWA", "JINA", "WIZARA/AFISI", "AINA YA MARADHI", "CHEO", "MALE", "FEMALE", "JUMLA", "TAREHE YA KUZALIWA", "UMRI"],
    dataKeys: ["sn", "trhKustaafu", "jina", "wizara", "ainaMaradhi", "cheo", "m", "f", "jumla", "trhKuzaliwa", "umri"],
    data: [
        { sn: 1, trhKustaafu: '26/01/2025', jina: 'Khamis Omar Moh’d', wizara: 'WAKALA WA MAJENGO ZANZIBAR', ainaMaradhi: 'LEGALITY BLINDNESS DUE TO BRAIN TUMOR', cheo: 'Fundi Mchundo', m: 1, f: 0, jumla: 1, trhKuzaliwa: '1/12/1971', umri: 51 },
        { sn: 2, trhKustaafu: '28/06/2030', jina: 'ISSA HASSAN ALI', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', ainaMaradhi: 'STROCK WITH LEFT SIDED HEMIPLEGIC', cheo: 'mwalimu', m: 1, f: 0, jumla: 1, trhKuzaliwa: '23/04/1970', umri: 50 },
        { sn: 3, trhKustaafu: '28/06/2031', jina: 'MKASI NASSOR HAMAD', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', ainaMaradhi: 'RHEUMATOID ARTHRISTS', cheo: 'Mkaguzi Elimu', m: 0, f: 1, jumla: 1, trhKuzaliwa: '11/11/1970', umri: 50 },
        { sn: 4, trhKustaafu: '28/06/2032', jina: 'ASHA JUMA KHALFAN', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', ainaMaradhi: 'HYPERTENSION, DIABETES MELLITUS TYPE 2, OLD STROCK WITH LEFT HEMIPARESIS', cheo: 'Mhudumu', m: 0, f: 1, jumla: 1, trhKuzaliwa: '07/12/1970', umri: 50 },
    ],
    totals: { sn: 'JUMLA', ainaMaradhi: '', cheo: '', m: 2, f: 2, jumla: 4 }
  }),
  lwop: () => ({
    title: 'Ripoti ya Likizo Bila Malipo',
    headers: ["S/N", "JINA", "WIZARA/AFISI", "MUDA", "M", "F", "T", "TAREHE YA KUIDHINISHA", "SABABU YA KUIDHINISHWA", "TAREHE YA KUANZIA", "TAREHE YA KUMALIZA", "AWAMU YA PILI", "TAREHE YA KUMALIZA (AWAMU 2)"],
    dataKeys: ["sn", "jina", "wizara", "muda", "m", "f", "t", "trhKuidhinisha", "sababuKuidhinishwa", "trhKuanzia", "trhKumaliza", "awamu2", "trhKumaliza2"],
    data: [
      { sn: 1, jina: 'MGENI MUSSA HAJI', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', muda: 3, m: 0, f: 1, t: 1, trhKuidhinisha: '23/10/2019', sababuKuidhinishwa: 'Masomo zaidi', trhKuanzia: '', trhKumaliza: '', awamu2: '', trhKumaliza2: '' },
      { sn: 2, jina: 'HASHIM CHANDE MUUMINI', wizara: 'WIZARA YA UCHUMI WA BULUU NA UVUVI', muda: 3, m: 1, f: 0, t: 1, trhKuidhinisha: '1/7/2022', sababuKuidhinishwa: 'Sababu za kifamilia', trhKuanzia: '', trhKumaliza: '', awamu2: '', trhKumaliza2: '' },
      { sn: 3, jina: 'RAJAB ALI JAKU', wizara: 'TAASISI YA ELIMU YA ZANZIBAR', muda: 2, m: 1, f: 0, t: 1, trhKuidhinisha: '2/8/2022', sababuKuidhinishwa: 'Kozi ya Ualimu', trhKuanzia: '1/8/2022', trhKumaliza: '31/07/2024', awamu2: '', trhKumaliza2: '' },
      { sn: 4, jina: 'SALAMA MZEE SALUM', wizara: 'TUME YA UTUMISHI SERIKALINI', muda: 3, m: 0, f: 1, t: 1, trhKuidhinisha: '11/8/2022', sababuKuidhinishwa: 'Kuuguza ndugu', trhKuanzia: '1/9/2022', trhKumaliza: '30/08/2025', awamu2: '', trhKumaliza2: '' },
      { sn: 5, jina: 'SULEIMAN ALI BAKAR', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', muda: 1, m: 1, f: 0, t: 1, trhKuidhinisha: '29/12/2022', sababuKuidhinishwa: 'Masomo ya ziada', trhKuanzia: '1/9/2022', trhKumaliza: '30/08/2023', awamu2: '', trhKumaliza2: '' },
      { sn: 6, jina: 'JUMA JUMBE HAJI', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', muda: 3, m: 1, f: 0, t: 1, trhKuidhinisha: '8/3/2023', sababuKuidhinishwa: 'Kujiendeleza kielimu', trhKuanzia: '21/02/2023', trhKumaliza: '20/02/2026', awamu2: '', trhKumaliza2: '' },
      { sn: 7, jina: 'HUSSEIN MUSSA NASSOR', wizara: 'TUME YA MAADILI YA VIONGOZI WA UMMA', muda: 4, m: 1, f: 0, t: 1, trhKuidhinisha: '8/4/2023', sababuKuidhinishwa: 'Mikataba ya kimataifa', trhKuanzia: '1/1/2023', trhKumaliza: '30/12/2023', awamu2: '1/1/2024', trhKumaliza2: '30/12/2026' },
    ],
    totals: { sn: 'JUMLA', wizara: '', muda: '', m: 5, f: 2, t: 7, sababuKuidhinishwa: '' }
  }),
  promotion: () => ({
    title: 'Ripoti ya Kupandishwa Cheo (Jumla)',
    headers: ["S.NO", "WIZARA/TAASISI", "MALE", "FEMALE", "JUMLA"],
    dataKeys: ["sno", "wizara", "m", "f", "jumla"],
    data: [
      { sno: 1, wizara: 'TUME YA UCHAGUZI YA ZANZIBAR', m: 1, f: 0, jumla: 1 },
      { sno: 2, wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', m: 4, f: 6, jumla: 10 },
      { sno: 3, wizara: 'WIZARA YA AFYA', m: 1, f: 10, jumla: 11 },
      { sno: 4, wizara: 'WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO', m: 2, f: 1, jumla: 3 },
    ],
    totals: { sno: 'JUMLA', wizara: '', m: 8, f: 17, jumla: 25 }
  }),
  promotionExperience: () => ({
    title: 'Ripoti ya Kupandishwa Cheo kwa Uzoefu',
    headers: ["S/N", "WIZARA/TAASISI", "JINA KAMILI", "JINSIA", "TAREHE YA KUANZA KAZI", "CHEO CHA SASA & DARAJA", "CHEO KILICHOPENDEKEZWA & DARAJA", "JUMLA"],
    dataKeys: ["sn", "wizara", "jinaKamili", "jinsia", "tareheKuanzaKazi", "cheoSasaNaDaraja", "cheoKilichopendekezwaNaDaraja", "jumla"],
    data: [
      { sn: 1, wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', jinaKamili: 'Salum Ali Juma', jinsia: 'M', tareheKuanzaKazi: '12/08/2015', cheoSasaNaDaraja: 'Assistant ICT Officer Grade I', cheoKilichopendekezwaNaDaraja: 'Senior Assistant ICT Officer', jumla: 1 },
      { sn: 2, wizara: 'WIZARA YA AFYA', jinaKamili: 'Asha Bakari Said', jinsia: 'F', tareheKuanzaKazi: '01/03/2012', cheoSasaNaDaraja: 'Registered Nurse Grade II', cheoKilichopendekezwaNaDaraja: 'Senior Registered Nurse', jumla: 1 },
      { sn: 3, wizara: 'OFISI YA RAIS - KATIBA SHERIA UTUMISHI NA UTAWALA BORA', jinaKamili: 'Khamis Omar Faki', jinsia: 'M', tareheKuanzaKazi: '15/05/2010', cheoSasaNaDaraja: 'HR Officer Grade I', cheoKilichopendekezwaNaDaraja: 'Principal HR Officer', jumla: 1 },
    ],
    totals: { sn: 'JUMLA', cheoSasaNaDaraja: '', cheoKilichopendekezwaNaDaraja: '', jumla: 3 } 
  }),
  promotionEducation: () => ({
    title: 'Ripoti ya Kupandishwa Cheo kwa Maendeleo ya Elimu',
    headers: ["S/N", "WIZARA/TAASISI", "JINA KAMILI", "JINSIA", "TAREHE YA KUANZA KAZI", "CHEO CHA SASA & DARAJA", "CHEO KIPYA & DARAJA", "JUMLA"],
    dataKeys: ["sn", "wizara", "jinaKamili", "jinsia", "tareheKuanzaKazi", "cheoSasaNaDaraja", "cheoKipyaNaDaraja", "jumla"],
    data: [
      { sn: 1, wizara: 'WIZARA YA UTALII NA MAMBO YA KALE', jinaKamili: 'Fatma Hamad Ali', jinsia: 'F', tareheKuanzaKazi: '10/07/2016', cheoSasaNaDaraja: 'Tourism Officer Grade II', cheoKipyaNaDaraja: 'Tourism Officer Grade I', jumla: 1 },
      { sn: 2, wizara: 'WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA', jinaKamili: 'Ahmed Salim Mohamed', jinsia: 'M', tareheKuanzaKazi: '05/02/2014', cheoSasaNaDaraja: 'Trade Officer Grade I', cheoKipyaNaDaraja: 'Senior Trade Officer', jumla: 1 },
    ],
    totals: { sn: 'JUMLA', cheoSasaNaDaraja: '', cheoKipyaNaDaraja: '', jumla: 2 } 
  }),
  terminationDismissal: () => ({
    title: 'Ripoti ya Kufukuzwa/Kuachishwa Kazi',
    headers: ["S.NO", "TAREHE YA KUWASILISHA OMBI", "JINA LA ANAEOMBEWA", "ZANID", "WIZARA/TAASISI", "MALE", "FEMALE", "JUMLA", "SABABU YA KUFUKUZWA", "TAREHE YA UAMUZI", "UAMUZI"],
    dataKeys: ["sno", "trhKuwasilisha", "jina", "zanId", "wizara", "m", "f", "jumla", "sababu", "trhUamuzi", "uamuzi"],
    data: [
        { sno: 1, trhKuwasilisha: '16/03/2023', jina: 'SALUM OMAR HAJI', zanId: '123456789', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', m: 1, f: 0, jumla: 1, sababu: 'Kutokua na mahudhurio mazuri kazini', trhUamuzi: '6/7/2023', uamuzi: 'Kafukuzwa kazi' },
        { sno: 2, trhKuwasilisha: '3/3/2024', jina: 'TIBBA G. MOLLO', zanId: '987654321', wizara: 'OFISI YA RAIS - IKULU', m: 0, f: 1, jumla: 1, sababu: 'Kutohudhuria kazini', trhUamuzi: '26/05/2023', uamuzi: 'Kafukuzwa kazi' },
        { sno: 3, trhKuwasilisha: '17/07/2023', jina: 'MWALIM HAMAD ALAWI', zanId: '112233445', wizara: 'WIZARA YA ELIMU NA MAFUNZO YA AMALI', m: 1, f: 0, jumla: 1, sababu: 'Kutohudhuria kazini', trhUamuzi: '7/9/2024', uamuzi: 'Ameachishwa kazi' },
    ],
    totals: { sno: 'JUMLA', wizara: '', m: 7, f: 3, jumla: 10 }
  }),
  complaints: () => ({
    title: 'Ripoti ya Malalamiko',
    headers: ["TAREHE YA KUWASILISHA LALAMIKO", "JINA LA MLALAMIKAJI", "WIZARA/TAASISI", "MALE", "FEMALE", "JUMLA", "LALAMIKO", "UAMUZI WA LALAMIKO"],
    dataKeys: ["trhKuwasilisha", "jina", "wizara", "m", "f", "jumla", "lalamiko", "uamuzi"],
    data: [
        { trhKuwasilisha: '20/12/2011', jina: 'AJUZA SILIMA ALI', wizara: 'WIZARA YA HABARI, VIJANA, UTAMADUNI NA MICHEZO', m: 1, f: 0, jumla: 1, lalamiko: 'Utoro na vitendo vya nidhamu na matusi', uamuzi: 'Amefukuzwa' },
        { trhKuwasilisha: '21/12/2011', jina: 'MLEKWA MUHIDINI ALI', wizara: 'WIZARA YA HABARI, VIJANA, UTAMADUNI NA MICHEZO', m: 0, f: 1, jumla: 1, lalamiko: 'Utoro', uamuzi: '' },
    ],
    totals: { sn: 'JUMLA', wizara: '', lalamiko: '', m: 2, f: 5, jumla: 7 }
  }),
  cadreChange: () => ({
    title: 'Ripoti ya Kubadilishwa Kada',
    headers: ["S.NO", "JINA", "WIZARA/TAASISI", "MALE", "FEMALE", "JUMLA", "KADA ANAYOTOKA", "KADA ANAYOINGIA"],
    dataKeys: ["sno", "jina", "wizara", "m", "f", "jumla", "kadaKutoka", "kadaKuingia"],
    data: [
        { sno: 1, jina: 'Shehe Omar Yussuf', wizara: 'OFISI YA MUFTI MKUU WA ZANZIBAR', m: 1, f: 0, jumla: 1, kadaKutoka: 'Mlinzi', kadaKuingia: 'Tarishi' },
        { sno: 2, jina: 'Shumbana Abdulhakim Muhsini', wizara: 'OFISI YA MAKAMO WA KWANZA WA RAISI', m: 0, f: 1, jumla: 1, kadaKutoka: 'Mhudumu', kadaKuingia: 'Afisa Sheria Msaidizi' },
    ],
    totals: {}
  }),
  resignation: () => ({
    title: 'Ripoti ya Kuacha Kazi kwa Hiari',
    headers: ["NAM", "JINA", "WIZARA/AFISI", "MALE", "FEMALE", "JUMLA", "TAREHE YA KUIDHINISHA", "UAMUZI"],
    dataKeys: ["nam", "jina", "wizara", "m", "f", "jumla", "trhKuidhinisha", "uamuzi"],
    data: [
        { nam: 1, jina: 'FEISAL ALI SALUM', wizara: 'WIZARA YA KILIMO UMWAGILIAJI MALIASILI NA MIFUGO', m: 1, f: 0, jumla: 1, trhKuidhinisha: '19/07/2024', uamuzi: 'TUME IMERIDHIA KUACHA KAZI' },
        { nam: 2, jina: 'RABIA HAMISI SELEMAN', wizara: 'Kamisheni ya Ardhi Zanzibar', m: 0, f: 1, jumla: 1, trhKuidhinisha: '8/1/2025', uamuzi: 'TUME IMERIDHIA' },
    ],
    totals: {}
  }),
  confirmation: () => ({
    title: 'Ripoti ya Kuthibitishwa Kazini',
    headers: ["NAM", "JINA KAMILI", "JINSIA", "WIZARA/TAASISI", "CHEO/WADHIFA", "TAREHE YA AJIRA", "TAREHE YA KUTHIBITISHWA", "CHETI CHA IPA", "NAM. YA SIMU"],
    dataKeys: ["nam", "jina", "jinsia", "wizara", "cheo", "trhAjira", "trhKuthibitishwa", "chetiIpa", "simu"],
    data: [
        { nam: 1, jina: 'ABDALLA MBARAOUK ALI', jinsia: 'M\'ME', wizara: 'Wizara ya Elimu na Mafunzo ya Amali', cheo: 'MWALIMU', trhAjira: '20/03/2023', trhKuthibitishwa: '19/03/2024', chetiIpa: 'IPA/IC/2024/9298', simu: '0772003809' },
        { nam: 2, jina: 'ALI SULEIMAN MKASI', jinsia: 'M\'ME', wizara: 'Wizara ya Elimu na Mafunzo ya Amali', cheo: 'MWALIMU', trhAjira: '02/05/2023', trhKuthibitishwa: '01/05/2024', chetiIpa: 'IPA/IC/2024/8931', simu: '0772800294' },
    ],
    totals: { 
        descriptionMale: 'JUMLA YA WANAUME', valueMale: 5,
        descriptionFemale: 'JUMLA YA WANAWAKE', valueFemale: 6,
        descriptionTotal: 'JUMLA KUU', valueTotal: 11
    }
  }),
  contractual: () => ({
    title: 'Ripoti ya Ajira za Mikataba',
    headers: ["NAM", "WIZARA/TAASISI", "KADA/CHEO", "JINA KAMILI", "MUDA WA MKATABA", "M'ME", "M'KE", "JUMLA", "TAREHE YA KUTOKA KIBALI", "HALI YA MKATABA"],
    dataKeys: ["nam", "wizara", "kada", "jina", "muda", "mme", "mke", "jumla", "trhKibali", "hali"],
    data: [
      { nam: 1, wizara: 'TUME YA UTUMISHI SERIKALINI', kada: 'MTAALAMU WA UCHUMI NA FEDHA', jina: 'Juma Haji', muda: 'MIAKA MIWILI', mme: 1, mke: 0, jumla: 1, trhKibali: '7-Jan-25', hali: 'AJIRA MPYA' },
      { nam: 2, wizara: 'AFISI YA RAIS TAWALA ZA MIKOA SERIKALI ZA MITAA NA IDARA MAALUMU ZA SMZ', kada: 'MKUU WA WILAYA WA MJINI-UNGUJA', jina: 'Amina Ali', muda: '', mme: 1, mke: 0, jumla: 1, trhKibali: '7-Jan-25', hali: 'KUONGEZEWA MKATABA' },
    ],
    totals: { nam: 'JUMLA KUU', wizara: '', kada: '', jina: '', muda: '', mme: 16, mke: 2, jumla: 18 }
  }),
};

const ALL_INSTITUTIONS_FILTER_VALUE = "__ALL_INSTITUTIONS__";

export default function ReportsPage() {
  const { user, role } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportHeaders, setReportHeaders] = useState<string[]>([]);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportTotals, setReportTotals] = useState<any>(null);
  const [reportDataKeys, setReportDataKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [institutionFilter, setInstitutionFilter] = useState<string>('');
  const [availableInstitutions, setAvailableInstitutions] = useState<Institution[]>([]);

  const isHigherLevelUser = useMemo(() => 
    [ROLES.HHRMD, ROLES.HRMO, ROLES.DO, ROLES.PO, ROLES.CSCS].includes(role as any),
    [role]
  );
  
  useEffect(() => {
    const fetchInstitutions = async () => {
        try {
            const response = await fetch('/api/institutions');
            if (response.ok) {
                const data = await response.json();
                setAvailableInstitutions(data);
            }
        } catch (error) {
            toast({title: "Error", description: "Could not load institutions for filter.", variant: "destructive"});
        }
    };
    fetchInstitutions();
  }, []);

  const getObjectKeys = (obj: any): string[] => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return Object.keys(obj);
    }
    return [];
  };

  const handleGenerateReport = () => {
    if (!selectedReportType) {
      toast({ title: "Kosa", description: "Tafadhali chagua aina ya ripoti.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setReportData([]);
    setReportHeaders([]);
    setReportTitle('');
    setReportTotals(null);
    setReportDataKeys([]);
    setCurrentPage(1);

    setTimeout(() => {
      const reportGenerator = MOCK_DATA_STORE[selectedReportType];
      if (reportGenerator) {
        const { data, headers, title, totals, dataKeys: keys } = reportGenerator();
        let filteredData = [...data];

        // Role-based and Institution filtering
        if (isHigherLevelUser) {
          if (institutionFilter && institutionFilter !== ALL_INSTITUTIONS_FILTER_VALUE) {
            filteredData = filteredData.filter(item => item.wizara === availableInstitutions.find(i => i.id === institutionFilter)?.name);
          }
        } else if (role === ROLES.HRO) {
          if (user?.institution) {
            filteredData = filteredData.filter(item => item.wizara === user.institution);
          } else {
            filteredData = []; // HRO with no institution assigned sees no data
          }
        }
        
        // Date filtering
        if (fromDate && toDate) {
          try {
            const startDate = startOfDay(parseISO(fromDate));
            const endDate = endOfDay(parseISO(toDate));

            if (isValid(startDate) && isValid(endDate) && !isWithinInterval(endDate, { start: new Date(0), end: startDate })) {
                filteredData = filteredData.filter(item => {
                    const itemDateKey = Object.keys(item).find(k => k.toLowerCase().includes('tarehe') || k.toLowerCase().includes('date'));
                    if (itemDateKey && item[itemDateKey]) {
                        try {
                            const itemDate = parseISO(item[itemDateKey]);
                            return isValid(itemDate) && isWithinInterval(itemDate, { start: startDate, end: endDate });
                        } catch (e) {
                            return false; 
                        }
                    }
                    return false;
                });
            } else if (isValid(startDate) && isValid(endDate)) {
              toast({ title: "Kosa la Tarehe", description: "Tarehe ya mwisho lazima iwe baada ya tarehe ya kuanza.", variant: "destructive"});
            }
          } catch(e) {
             toast({ title: "Kosa la Tarehe", description: "Muundo wa tarehe si sahihi.", variant: "destructive"});
          }
        }

        setReportData(filteredData);
        setReportHeaders(headers);
        setReportTitle(title);
        setReportTotals(totals);
        setReportDataKeys(keys || getObjectKeys(data[0] || {}));
        if (filteredData.length === 0) {
            toast({ title: "Ripoti Imetolewa", description: `Hakuna taarifa kwa ${title} katika vigezo ulivyochagua.` });
        } else {
            toast({ title: "Ripoti Imetolewa", description: `${title} imetolewa kikamilifu.` });
        }
      } else {
        toast({ title: "Kosa", description: "Aina ya ripoti iliyochaguliwa haipo.", variant: "destructive" });
      }
      setIsGenerating(false);
    }, 1500);
  };

  const handleExportToPdf = () => {
    if (reportData.length === 0 || reportHeaders.length === 0) {
      toast({ title: "Kosa la Kuhamisha", description: "Hakuna data ya kuhamisha.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    doc.setFontSize(10);
    doc.text(`Kipindi: ${fromDate || 'N/A'} hadi ${toDate || 'N/A'}`, 14, 30);
    if(isHigherLevelUser && institutionFilter && institutionFilter !== ALL_INSTITUTIONS_FILTER_VALUE) {
        const instName = availableInstitutions.find(i => i.id === institutionFilter)?.name;
        doc.text(`Taasisi: ${instName}`, 14, 36);
    } else if(role === ROLES.HRO && user?.institution) {
        doc.text(`Taasisi: ${user.institution}`, 14, 36);
    }

    const tableColumn = reportHeaders;
    const tableRows: any[][] = [];

    reportData.forEach(item => {
      const rowData = reportDataKeys.map(key => item[key] !== undefined ? String(item[key]) : '');
      tableRows.push(rowData);
    });

    const footRows: any[][] = [];
    if (reportTotals) {
      if (selectedReportType === 'confirmation' && reportTotals.descriptionMale) {
        const emptyCells = Array(reportDataKeys.length - 2).fill('');
        footRows.push([reportTotals.descriptionMale, ...emptyCells, String(reportTotals.valueMale)]);
        footRows.push([reportTotals.descriptionFemale, ...emptyCells, String(reportTotals.valueFemale)]);
        footRows.push([reportTotals.descriptionTotal, ...emptyCells, String(reportTotals.valueTotal)]);
      } else if (Object.keys(reportTotals).length > 0) {
        const totalRow = reportDataKeys.map((key, index) => {
          if (index === 0 && (reportTotals.sn || reportTotals.sno || reportTotals.nam)) {
            return String(reportTotals.sn || reportTotals.sno || reportTotals.nam);
          }
          return reportTotals[key] !== undefined ? String(reportTotals[key]) : '';
        });
        footRows.push(totalRow);
      }
    }
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      foot: footRows.length > 0 ? footRows : undefined,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] },
      footStyles: { fillColor: [211, 211, 211], textColor: [0,0,0], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 'auto' } }, // Adjust column widths as needed
    });
    
    doc.save(`${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
    toast({ title: "PDF Imehamishwa", description: "Ripoti imehamishwa kwenda PDF." });
  };

  const handleExportToExcel = () => {
    if (reportData.length === 0 || reportHeaders.length === 0) {
      toast({ title: "Kosa la Kuhamisha", description: "Hakuna data ya kuhamisha.", variant: "destructive" });
      return;
    }

    const wsData: any[][] = [reportHeaders];

    reportData.forEach(item => {
      const rowData = reportDataKeys.map(key => item[key] !== undefined ? item[key] : '');
      wsData.push(rowData);
    });

    if (reportTotals) {
      if (selectedReportType === 'confirmation' && reportTotals.descriptionMale) {
         const emptyCells = Array(reportDataKeys.length - 2).fill('');
        wsData.push([reportTotals.descriptionMale, ...emptyCells, reportTotals.valueMale]);
        wsData.push([reportTotals.descriptionFemale, ...emptyCells, reportTotals.valueFemale]);
        wsData.push([reportTotals.descriptionTotal, ...emptyCells, reportTotals.valueTotal]);
      } else if (Object.keys(reportTotals).length > 0) {
        const totalRow = reportDataKeys.map((key, index) => {
           if (index === 0 && (reportTotals.sn || reportTotals.sno || reportTotals.nam)) {
            return reportTotals.sn || reportTotals.sno || reportTotals.nam;
          }
          return reportTotals[key] !== undefined ? reportTotals[key] : '';
        });
        wsData.push(totalRow);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ripoti");
    XLSX.writeFile(wb, `${reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.xlsx`);
    toast({ title: "Excel Imehamishwa", description: "Ripoti imehamishwa kwenda Excel." });
  };
  
  const totalPages = Math.ceil(reportData.length / itemsPerPage);
  const paginatedData = reportData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderTableFooter = () => {
    if (!reportTotals || reportHeaders.length === 0) return null;

    if (selectedReportType === 'confirmation' && reportTotals.descriptionMale) {
         return (
            <React.Fragment>
                <TableRow className="bg-secondary hover:bg-secondary/80 font-semibold">
                    <TableCell colSpan={reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1}>{reportTotals.descriptionMale}</TableCell>
                    <TableCell></TableCell> 
                    <TableCell colSpan={reportHeaders.length - (reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1) -1} className="text-right">{reportTotals.valueMale}</TableCell>
                </TableRow>
                <TableRow className="bg-secondary hover:bg-secondary/80 font-semibold">
                    <TableCell colSpan={reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1}>{reportTotals.descriptionFemale}</TableCell>
                     <TableCell></TableCell> 
                    <TableCell colSpan={reportHeaders.length - (reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1)-1} className="text-right">{reportTotals.valueFemale}</TableCell>
                </TableRow>
                 <TableRow className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    <TableCell colSpan={reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1}>{reportTotals.descriptionTotal}</TableCell>
                     <TableCell></TableCell> 
                    <TableCell colSpan={reportHeaders.length - (reportHeaders.findIndex(h => h.toLowerCase().includes('jinsia')) || 1)-1} className="text-right">{reportTotals.valueTotal}</TableCell>
                </TableRow>
            </React.Fragment>
        );
    }
    
    const totalRowCells: JSX.Element[] = [];
    let totalsRendered = false;
    reportHeaders.forEach((header, index) => {
        const key = reportDataKeys[index] || header.toLowerCase().replace(/[^a-z0-9]/gi, '');
        const totalValue = reportTotals[key];

        if (totalValue !== undefined) {
             if (index === 0 && (reportTotals.sn || reportTotals.sno || reportTotals.nam) ) {
                 totalRowCells.push(<TableCell key={`${header}-total`} className="font-bold">{reportTotals.sn || reportTotals.sno || reportTotals.nam || 'JUMLA'}</TableCell>);
             } else {
                totalRowCells.push(<TableCell key={`${header}-total`} className="font-semibold text-right">{totalValue}</TableCell>);
             }
             totalsRendered = true;
        } else if (index === 0 && (reportTotals.sn || reportTotals.sno || reportTotals.nam)) {
            totalRowCells.push(<TableCell key={`${header}-total-label`} className="font-bold">{reportTotals.sn || reportTotals.sno || reportTotals.nam}</TableCell>);
        }
         else {
            totalRowCells.push(<TableCell key={`${header}-total-empty`}></TableCell>);
        }
    });

    if (!totalsRendered && Object.keys(reportTotals).length > 0 && !reportTotals.sn && !reportTotals.sno && !reportTotals.nam) {
        const firstKey = reportDataKeys[0];
        if (firstKey && totalRowCells[0]) {
             totalRowCells[0] = <TableCell key={`${firstKey}-total-label`} className="font-bold">JUMLA</TableCell>;
        }
    }


    return (
        <TableRow className="bg-secondary hover:bg-secondary/80 font-semibold">
            {totalRowCells}
        </TableRow>
    );
  };


  return (
    <div>
      <PageHeader title="Ripoti na Takwimu" description="Toa na angalia ripoti za mfumo." />
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Chagua Ripoti</CardTitle>
          <CardDescription>Chagua aina ya ripoti na vigezo vingine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor="reportType">Aina ya Ripoti</Label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Chagua aina ya ripoti" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isHigherLevelUser && (
                 <div className="space-y-1 lg:col-span-2">
                 <Label htmlFor="institutionFilter">Taasisi / Wizara</Label>
                 <Select value={institutionFilter} onValueChange={setInstitutionFilter} disabled={isGenerating}>
                     <SelectTrigger id="institutionFilter">
                         <SelectValue placeholder="Chagua taasisi (si lazima)" />
                     </SelectTrigger>
                     <SelectContent>
                         <SelectItem value={ALL_INSTITUTIONS_FILTER_VALUE}>Taasisi Zote</SelectItem>
                         {availableInstitutions.map(inst => (
                             <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                         ))}
                     </SelectContent>
                 </Select>
               </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="fromDate">Kuanzia Tarehe</Label>
              <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} disabled={isGenerating}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="toDate">Hadi Tarehe</Label>
              <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} disabled={isGenerating}/>
            </div>
          </div>
          <div className="pt-4">
            <Button onClick={handleGenerateReport} disabled={isGenerating}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Toa Ripoti
            </Button>
          </div>
        </CardContent>
      </Card>

      {isGenerating && (
        <div className="flex items-center justify-center mt-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Inatayarisha ripoti...</p>
        </div>
      )}

      {!isGenerating && reportTitle && (
        <Card className="shadow-lg mt-6">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>{reportTitle}</CardTitle>
              {fromDate && toDate && <CardDescription>Kipindi: {fromDate} hadi {toDate}</CardDescription>}
            </div>
            {reportData.length > 0 && (
                 <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleExportToPdf}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Hamisha PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportToExcel}>
                      <FileDown className="mr-2 h-4 w-4" />
                      Hamisha Excel
                    </Button>
                  </div>
            )}
          </CardHeader>
          <CardContent>
            {reportData.length > 0 ? (
              <>
              <Table>
                {fromDate && toDate && <TableCaption>Ripoti ya {reportTitle.toLowerCase()} kuanzia {fromDate} hadi {toDate}.</TableCaption>}
                <TableHeader>
                  <TableRow>
                    {reportHeaders.map(header => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {reportDataKeys.map(key => (
                        <TableCell key={key}>{row[key]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {currentPage === totalPages && reportTotals && Object.keys(reportTotals).length > 0 && renderTableFooter()}
                </TableBody>
              </Table>
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={reportData.length}
                itemsPerPage={itemsPerPage}
              />
              </>
            ) : (
               <p className="text-muted-foreground text-center py-4">Hakuna taarifa zilizopatikana kwa ripoti hii katika vigezo ulivyochagua.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
