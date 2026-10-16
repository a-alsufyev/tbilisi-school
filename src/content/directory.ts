import type { LookupKind } from "../lib/lookups";
import type { UiLang } from "../lib/schools";

export type DirectoryArticle = {
  marker: boolean;
  text: Record<UiLang, string>;
};

function article(marker: boolean, en: string, ru: string, ge: string, de: string): DirectoryArticle {
  return { marker, text: { en, ru, ge, de } };
}

const ARTICLES: Record<string, DirectoryArticle> = {
  "program:american curriculum": article(
    false,
    "The American curriculum is the school model used in the United States. Students take a broad set of subjects, collect course credits and receive a school diploma. Grades accumulate over several years rather than in one set of national leaving exams. A school may add Advanced Placement courses, but those are a separate option, not the curriculum itself. In this catalog the entry is not the same as QSI.",
    "Американская программа — школьная модель США. Ученики проходят широкий набор предметов, набирают зачёты по курсам и получают диплом школы. Оценки копятся за несколько лет, а не сводятся к одному пакету государственных выпускных экзаменов. Школа может добавить курсы Advanced Placement, но это отдельная возможность, а не сама программа. В каталоге это не то же самое, что QSI.",
    "ამერიკული პროგრამა აშშ-ის სასკოლო მოდელია. მოსწავლეები გადიან საგნების ფართო ნაკრებს, აგროვებენ კურსების კრედიტებს და იღებენ სკოლის დიპლომს. შეფასება გროვდება რამდენიმე წლის განმავლობაში და არ ეყრდნობა ერთ სახელმწიფო გამოსაშვებ გამოცდას. სკოლამ შეიძლება დაამატოს Advanced Placement, მაგრამ ეს ცალკე შესაძლებლობაა და არა თავად პროგრამა. კატალოგში ეს არ არის QSI.",
    "Das American Curriculum ist das Schulmodell der USA. Die Schülerinnen und Schüler belegen ein breites Fächerspektrum, sammeln Kursleistungen und erhalten ein Schuldiplom. Die Noten entstehen über mehrere Jahre und nicht durch ein einzelnes staatliches Abschlussprüfungspaket. Advanced-Placement-Kurse können dazukommen, sind aber eine eigene Option und nicht der Lehrplan selbst. Im Katalog ist das nicht dasselbe wie QSI."
  ),
  "program:british": article(
    false,
    "The British programme follows the school structure used in England: a broad range of subjects in the earlier years, then external qualifications, typically GCSEs around age 16 and A-levels later, when students specialise in a few subjects. This is a general label for that model. In this catalog it is separate from Cambridge and from Pearson Edexcel, which are specific awarding organisations.",
    "Британская программа повторяет устройство школы в Англии: сначала широкий набор предметов, затем внешние квалификации — обычно GCSE около 16 лет и A-level позже, когда ученик углубляется в несколько предметов. Это общее название такой модели. В каталоге она отдельно от Cambridge и Pearson Edexcel: те пункты — конкретные экзаменационные организации.",
    "ბრიტანული პროგრამა ინგლისის სასკოლო წყობას მიჰყვება: ჯერ საგნების ფართო ნაკრები, შემდეგ გარე კვალიფიკაციები — ჩვეულებრივ GCSE დაახლოებით 16 წლის ასაკში და მოგვიანებით A-level, როცა მოსწავლე რამდენიმე საგანში ღრმავდება. ეს ამ მოდელის ზოგადი სახელია. კატალოგში ის ცალკეა Cambridge-ისა და Pearson Edexcel-ისგან: ისინი კონკრეტული საგამოცდო ორგანიზაციებია.",
    "Das britische Programm folgt dem Schulaufbau in England: zuerst ein breites Fächerspektrum, danach externe Abschlüsse, üblicherweise GCSEs mit etwa 16 Jahren und später A-Levels, wenn sich die Schülerinnen und Schüler auf wenige Fächer spezialisieren. Das ist eine allgemeine Bezeichnung für dieses Modell. Im Katalog steht es getrennt von Cambridge und Pearson Edexcel, den konkreten Prüfungsorganisationen."
  ),
  "program:cambridge": article(
    false,
    "Cambridge is the Cambridge Pathway from Cambridge International Education, for learners from about 3 to 19. A school can offer the whole pathway or separate stages: Early Years, Primary, Lower Secondary, Upper Secondary with Cambridge IGCSE or O Level, and Advanced with Cambridge International AS & A Level. UK ENIC has benchmarked Cambridge IGCSE as comparable to GCSE. This entry is the programme. The status Cambridge International School, listed separately, means the school is registered with Cambridge to offer these qualifications.",
    "Cambridge — это Cambridge Pathway организации Cambridge International Education, примерно с 3 до 19 лет. Школа может вести весь путь или отдельные ступени: Early Years, Primary, Lower Secondary, Upper Secondary с Cambridge IGCSE или O Level и Advanced с Cambridge International AS & A Level. UK ENIC сопоставил Cambridge IGCSE с GCSE. Этот пункт — сама программа. Статус Cambridge International School стоит отдельно и значит, что школа зарегистрирована в Cambridge и может предлагать эти квалификации.",
    "Cambridge არის Cambridge International Education-ის Cambridge Pathway, დაახლოებით 3-დან 19 წლამდე. სკოლას შეუძლია სრული გზა ან ცალკე საფეხურები: Early Years, Primary, Lower Secondary, Upper Secondary Cambridge IGCSE-ით ან O Level-ით და Advanced Cambridge International AS & A Level-ით. UK ENIC-მა Cambridge IGCSE GCSE-ს გაუთანაბრა. ეს პუნქტი თავად პროგრამაა. სტატუსი Cambridge International School ცალკე დგას და ნიშნავს, რომ სკოლა Cambridge-შია რეგისტრირებული და ამ კვალიფიკაციებს სთავაზობს.",
    "Cambridge ist der Cambridge Pathway von Cambridge International Education, etwa vom 3. bis zum 19. Lebensjahr. Eine Schule kann den ganzen Weg oder einzelne Stufen anbieten: Early Years, Primary, Lower Secondary, Upper Secondary mit Cambridge IGCSE oder O Level und Advanced mit Cambridge International AS & A Level. UK ENIC hat Cambridge IGCSE mit dem GCSE verglichen. Dieser Eintrag ist das Programm. Der getrennt aufgeführte Status Cambridge International School bedeutet, dass die Schule bei Cambridge registriert ist und diese Abschlüsse anbieten darf."
  ),
  "program:georgian national curriculum": article(
    false,
    "The Georgian national curriculum is the state programme for general education in Georgia. It covers the primary, basic and secondary levels and belongs to the national system overseen by the Ministry of Education. The current reform moves it toward a competence-based curriculum. It is the national programme, not an international one such as the IB or Cambridge.",
    "Грузинская национальная программа — государственная программа общего образования Грузии. Она охватывает начальную, основную и среднюю ступени и относится к национальной системе, за которую отвечает Министерство образования. Текущая реформа переводит её к компетентностной модели. Это национальная программа, а не международная вроде IB или Cambridge.",
    "ქართული ეროვნული პროგრამა საქართველოს ზოგადი განათლების სახელმწიფო პროგრამაა. ის მოიცავს დაწყებით, საბაზო და საშუალო საფეხურებს და ეკუთვნის ეროვნულ სისტემას, რომელზეც განათლების სამინისტრო პასუხისმგებელია. მიმდინარე რეფორმა მას კომპეტენციებზე დაფუძნებულ მოდელზე გადაჰყავს. ეს ეროვნული პროგრამაა და არა საერთაშორისო, როგორიცაა IB ან Cambridge.",
    "Das georgische nationale Curriculum ist das staatliche Programm der allgemeinen Bildung in Georgien. Es umfasst die Primar-, die Basis- und die Sekundarstufe und gehört zum nationalen System, für das das Bildungsministerium zuständig ist. Die laufende Reform führt es zu einem kompetenzorientierten Lehrplan. Es ist das nationale Programm, nicht ein internationales wie IB oder Cambridge."
  ),
  "program:ib": article(
    false,
    "The International Baccalaureate is a set of programmes from the IB, a non-profit, with one framework used by schools in many countries. There are four: the Primary Years Programme (ages 3–12), the Middle Years Programme (11–16), the Diploma Programme (16–19) and the Career-related Programme (16–19). The Diploma Programme has six subject groups and a core: theory of knowledge, an extended essay, and creativity, activity, service. Teaching IB-style lessons is not the same as the separate status IB World School, which means the IB has authorized the school to offer one or more of these programmes.",
    "International Baccalaureate — набор программ некоммерческой организации IB с общей рамкой для школ в разных странах. Программ четыре: Primary Years Programme (3–12 лет), Middle Years Programme (11–16), Diploma Programme (16–19) и Career-related Programme (16–19). В Diploma Programme шесть групп предметов и ядро: теория познания, развёрнутое эссе и creativity, activity, service. Уроки «в духе IB» — не то же самое, что отдельный статус IB World School: его школа получает, только когда IB авторизовал одну или несколько этих программ.",
    "International Baccalaureate არის არაკომერციული ორგანიზაციის, IB-ის, პროგრამების ნაკრები ერთი ჩარჩოთი სხვადასხვა ქვეყნის სკოლებისთვის. ოთხი პროგრამაა: Primary Years Programme (3–12 წელი), Middle Years Programme (11–16), Diploma Programme (16–19) და Career-related Programme (16–19). Diploma Programme-ს აქვს საგნების ექვსი ჯგუფი და ბირთვი: ცოდნის თეორია, გაფართოებული ესე და creativity, activity, service. „IB-ის სულისკვეთებით“ სწავლება არ არის იგივე, რაც ცალკე სტატუსი IB World School: მას სკოლა მხოლოდ მაშინ იღებს, როცა IB ერთ ან რამდენიმე პროგრამას უფლებას აძლევს.",
    "Das International Baccalaureate ist ein Programmangebot der gemeinnützigen IB mit einem gemeinsamen Rahmen für Schulen in vielen Ländern. Es gibt vier Programme: das Primary Years Programme (3–12 Jahre), das Middle Years Programme (11–16), das Diploma Programme (16–19) und das Career-related Programme (16–19). Das Diploma Programme hat sechs Fächergruppen und einen Kern: Theory of Knowledge, einen Extended Essay sowie Creativity, Activity, Service. Unterricht im Stil des IB ist nicht dasselbe wie der getrennte Status IB World School: Den vergibt das IB erst, wenn es die Schule für eines oder mehrere dieser Programme autorisiert hat."
  ),
  "program:pearson edexcel": article(
    false,
    "Pearson Edexcel is an awarding organisation. For international schools its academic pathway, iProgress, includes iPrimary, iLowerSecondary, International GCSE and International Advanced Level, along with other Pearson qualifications. A school enters candidates for these exams only as an approved Pearson centre. In this catalog the programme is separate from the status Pearson Edexcel Approved Centre and from Cambridge.",
    "Pearson Edexcel — экзаменационная организация. Для международных школ её академическая линейка iProgress включает iPrimary, iLowerSecondary, International GCSE и International Advanced Level, а также другие квалификации Pearson. Заявлять учеников на эти экзамены школа может только как одобренный центр Pearson. В каталоге программа отдельно от статуса Pearson Edexcel Approved Centre и от Cambridge.",
    "Pearson Edexcel საგამოცდო ორგანიზაციაა. საერთაშორისო სკოლებისთვის მისი აკადემიური ხაზი, iProgress, მოიცავს iPrimary-ს, iLowerSecondary-ს, International GCSE-ს და International Advanced Level-ს, ასევე Pearson-ის სხვა კვალიფიკაციებს. ამ გამოცდებზე მოსწავლეების დაშვება სკოლას მხოლოდ Pearson-ის დამტკიცებული ცენტრის სტატუსით შეუძლია. კატალოგში პროგრამა ცალკეა სტატუსისგან Pearson Edexcel Approved Centre და Cambridge-ისგან.",
    "Pearson Edexcel ist eine Prüfungsorganisation. Für internationale Schulen umfasst der akademische Weg iProgress unter anderem iPrimary, iLowerSecondary, International GCSE und International Advanced Level sowie weitere Pearson-Abschlüsse. Eine Schule darf Prüflinge nur als anerkanntes Pearson-Centre anmelden. Im Katalog steht das Programm getrennt vom Status Pearson Edexcel Approved Centre und von Cambridge."
  ),
  "program:qsi": article(
    false,
    "QSI is the curriculum of Quality Schools International, written for QSI schools. It is built around stated learning objectives. Teaching uses mastery learning: a student moves to the next unit after showing mastery of the current one, and time is used to reteach rather than to pass with part of the material missed. QSI aligns courses with standards used in the United States, including the Common Core, and uses US textbooks, but it is QSI’s own programme, not the general American curriculum.",
    "QSI — программа организации Quality Schools International, написанная для школ QSI. Она строится вокруг явных учебных целей. Обучение идёт по модели mastery learning: ученик переходит к следующему блоку, когда показал освоение текущего, а время уходит на повторное объяснение, а не на зачёт с пробелами. Курсы QSI соотносятся со стандартами США, включая Common Core, и опираются на американские учебники, но это собственная программа QSI, а не общая американская.",
    "QSI არის Quality Schools International-ის პროგრამა, დაწერილი QSI-ის სკოლებისთვის. ის აგებულია მკაფიო სასწავლო მიზნებზე. სწავლება mastery learning-ის მოდელით მიდის: მოსწავლე შემდეგ ბლოკზე მაშინ გადადის, როცა მიმდინარეს დაეუფლა, დრო კი ხელახლა ახსნას ხმარდება და არა ნაწილობრივ ჩაბარებას. QSI-ის კურსები აშშ-ის სტანდარტებს, მათ შორის Common Core-ს, ეყრდნობა და ამერიკულ სახელმძღვანელოებს იყენებს, მაგრამ ეს QSI-ის საკუთარი პროგრამაა და არა ზოგადი ამერიკული.",
    "QSI ist der Lehrplan von Quality Schools International, geschrieben für QSI-Schulen. Er ist um klare Lernziele herum aufgebaut. Der Unterricht folgt Mastery Learning: Wer die Ziele einer Einheit zeigt, geht zur nächsten weiter, und Zeit wird zum erneuten Erklären genutzt statt zum Weitergehen mit Lücken. QSI richtet die Kurse an US-Standards aus, darunter den Common Core, und nutzt US-Lehrbücher. Es bleibt das eigene Programm von QSI und nicht das allgemeine American Curriculum."
  ),
  "program:немецкая": article(
    false,
    "This label means a German school programme. German schools, including German schools abroad, teach according to the curriculum of a German state. In the upper years the usual leaving qualification is the Abitur, the general higher-education entrance qualification. German schools abroad may award the German International Abitur, treated as equivalent to an Abitur issued in Germany. The label does not name a particular German state.",
    "Подпись означает немецкую школьную программу. Немецкие школы, в том числе немецкие школы за рубежом, учат по программе одной из земель Германии. В старших классах обычный выпускной документ — Abitur, общая квалификация для поступления в вуз. Немецкие школы за рубежом могут выдавать немецкий международный Abitur, который приравнивается к Abitur, выданному в Германии. Подпись не называет конкретную землю.",
    "ეს წარწერა გერმანულ სასკოლო პროგრამას ნიშნავს. გერმანული სკოლები, მათ შორის საზღვარგარეთის გერმანული სკოლები, გერმანიის ერთ-ერთი მიწის პროგრამით ასწავლიან. უფროს კლასებში ჩვეულებრივი გამოსაშვები დოკუმენტია Abitur, უმაღლესში ჩაბარების ზოგადი კვალიფიკაცია. საზღვარგარეთის გერმანულ სკოლებს შეუძლიათ გერმანული საერთაშორისო Abitur გასცენ, რომელიც გერმანიაში გაცემულ Abitur-ს უთანაბრდება. წარწერა კონკრეტულ მიწას არ ასახელებს.",
    "Diese Bezeichnung meint ein deutsches Schulprogramm. Deutsche Schulen, auch deutsche Schulen im Ausland, unterrichten nach dem Lehrplan eines deutschen Landes. In den oberen Jahrgängen ist der übliche Abschluss das Abitur, die allgemeine Hochschulreife. Deutsche Schulen im Ausland können das Deutsche Internationale Abitur vergeben, das einem in Deutschland ausgestellten Abitur gleichsteht. Die Bezeichnung nennt kein bestimmtes Bundesland."
  ),
  "program:фгос (russian national curriculum)": article(
    false,
    "FGOS is the federal state educational standard of Russia. It sets what a programme of primary, basic and secondary general education must include, the conditions for teaching it, and the results students are expected to reach. It is the Russian national curriculum, not the Georgian one.",
    "ФГОС — федеральный государственный образовательный стандарт России. Он задаёт, что должна включать программа начального, основного и среднего общего образования, в каких условиях её ведут и каких результатов ждут от учеников. Это российская национальная программа, а не грузинская.",
    "ფგოს რუსეთის ფედერალური სახელმწიფო საგანმანათლებლო სტანდარტია. ის განსაზღვრავს, რას უნდა მოიცავდეს დაწყებითი, საბაზო და საშუალო ზოგადი განათლების პროგრამა, რა პირობებში ისწავლება და რა შედეგს ელიან მოსწავლისგან. ეს რუსული ეროვნული პროგრამაა და არა ქართული.",
    "FGOS ist der föderale staatliche Bildungsstandard Russlands. Er legt fest, was ein Programm der primären, grundlegenden und mittleren allgemeinen Bildung enthalten muss, unter welchen Bedingungen es unterrichtet wird und welche Ergebnisse von den Schülerinnen und Schülern erwartet werden. Es ist das russische nationale Curriculum, nicht das georgische."
  ),
  "program:финская": article(
    false,
    "The Finnish programme follows the national core curriculum for basic education from the Finnish National Agency for Education, published in 2014 and introduced in schools from 2016. It is still organised by school subjects. Each municipality or school writes a local curriculum on that national foundation. The core curriculum adds transversal competences and at least one multidisciplinary learning module a year. Basic education does not end with a single national leaving exam.",
    "Финская программа следует национальной основе учебной программы основного образования Финляндии. Её опубликовало Финское национальное агентство образования в 2014 году, в школы она вошла с 2016-го. Предметы остаются основой. Муниципалитет или школа пишет на этой основе местную программу. В национальной основе есть сквозные компетенции и не меньше одного межпредметного модуля в год. Основное образование не заканчивается единым государственным выпускным экзаменом.",
    "ფინური პროგრამა ფინეთის ძირითადი განათლების ეროვნულ სასწავლო ჩარჩოს მიჰყვება. ის ფინეთის განათლების ეროვნულმა სააგენტომ 2014 წელს გამოაქვეყნა და სკოლებში 2016 წლიდან შევიდა. საგნები კვლავ საფუძველია. მუნიციპალიტეტი ან სკოლა ამ ჩარჩოზე ადგილობრივ პროგრამას წერს. ეროვნულ ჩარჩოში არის განივი კომპეტენციები და წელიწადში სულ მცირე ერთი საგნებსშორისი მოდული. ძირითადი განათლება ერთი სახელმწიფო გამოსაშვები გამოცდით არ მთავრდება.",
    "Das finnische Programm folgt dem nationalen Kerncurriculum für die Grundbildung der Finnischen Nationalen Agentur für Bildung, veröffentlicht 2014 und ab 2016 in den Schulen. Der Unterricht bleibt fachlich gegliedert. Kommune oder Schule schreiben darauf ein lokales Curriculum. Der Kernlehrplan ergänzt überfachliche Kompetenzen und mindestens ein fächerübergreifendes Lernmodul im Jahr. Die Grundbildung endet nicht mit einer einzelnen staatlichen Abschlussprüfung."
  ),
  "program:not identified": article(
    true,
    "The catalog does not name a programme for this school. The mark is not itself a curriculum.",
    "Каталог не называет программу этой школы. Отметка сама по себе не учебная программа.",
    "კატალოგი ამ სკოლის პროგრამას არ ასახელებს. ნიშანი თავისთავად სასწავლო პროგრამა არ არის.",
    "Der Katalog nennt für diese Schule kein Programm. Die Markierung ist selbst kein Lehrplan."
  ),
  "program:other": article(
    true,
    "The school’s programme does not match the named entries in this directory. The mark is not itself a curriculum.",
    "Программа школы не совпадает с названными пунктами этого справочника. Отметка сама по себе не учебная программа.",
    "სკოლის პროგრამა ამ ცნობარის დასახელებულ პუნქტებს არ ემთხვევა. ნიშანი თავისთავად სასწავლო პროგრამა არ არის.",
    "Das Programm der Schule entspricht keinem benannten Eintrag in diesem Verzeichnis. Die Markierung ist selbst kein Lehrplan."
  ),
  "international_status:cambridge international school": article(
    false,
    "Cambridge International School is a registration status, not a separate curriculum. Cambridge grants it to a school that has registered successfully and may offer Cambridge programmes and qualifications. A registered school receives a certificate and may use the Cambridge school name and logo. An approved exam centre is different: it administers exams and does not teach the programmes. The programme itself is listed under Cambridge.",
    "Cambridge International School — статус регистрации, а не отдельная программа. Cambridge даёт его школе, которая успешно зарегистрировалась и может предлагать программы и квалификации Cambridge. Такая школа получает сертификат и может использовать название и знак школы Cambridge. Одобренный экзаменационный центр — другое: он проводит экзамены и программы не преподаёт. Сама программа стоит в пункте Cambridge.",
    "Cambridge International School რეგისტრაციის სტატუსია და არა ცალკე პროგრამა. Cambridge მას იმ სკოლას აძლევს, რომელიც წარმატებით დარეგისტრირდა და Cambridge-ის პროგრამებსა და კვალიფიკაციებს სთავაზობს. ასეთი სკოლა იღებს სერტიფიკატს და შეუძლია Cambridge-ის სკოლის სახელი და ნიშანი გამოიყენოს. დამტკიცებული საგამოცდო ცენტრი სხვა რამ არის: ის გამოცდებს ატარებს და პროგრამებს არ ასწავლის. თავად პროგრამა პუნქტში Cambridge დგას.",
    "Cambridge International School ist ein Registrierungsstatus, kein eigener Lehrplan. Cambridge vergibt ihn an eine Schule, die sich erfolgreich registriert hat und Cambridge-Programme und -Abschlüsse anbieten darf. Eine registrierte Schule erhält ein Zertifikat und darf den Namen und das Zeichen einer Cambridge-Schule nutzen. Ein anerkanntes Prüfungszentrum ist etwas anderes: Es führt Prüfungen durch und unterrichtet die Programme nicht. Das Programm selbst steht unter Cambridge."
  ),
  "international_status:ib world school": article(
    false,
    "IB World School means the International Baccalaureate has authorized the school to offer one or more IB programmes. Authorization follows candidacy, a verification visit and a decision by the IB. A school that is only preparing, or that borrows IB ideas without authorization, is not an IB World School. The programmes themselves are listed under IB.",
    "IB World School значит, что International Baccalaureate авторизовал школу вести одну или несколько программ IB. Авторизация идёт после кандидатуры, проверочного визита и решения IB. Школа, которая только готовится или берёт идеи IB без авторизации, не IB World School. Сами программы стоят в пункте IB.",
    "IB World School ნიშნავს, რომ International Baccalaureate-მა სკოლას ერთი ან რამდენიმე IB პროგრამის უფლება მისცა. ავტორიზაცია კანდიდატობის, გადამოწმების ვიზიტისა და IB-ის გადაწყვეტილების შემდეგ ხდება. სკოლა, რომელიც მხოლოდ ემზადება ან IB-ის იდეებს ავტორიზაციის გარეშე იყენებს, IB World School არ არის. თავად პროგრამები პუნქტში IB დგას.",
    "IB World School bedeutet, dass das International Baccalaureate die Schule autorisiert hat, eines oder mehrere IB-Programme anzubieten. Die Autorisierung folgt auf die Kandidatur, einen Überprüfungsbesuch und einen Beschluss des IB. Eine Schule, die sich nur vorbereitet oder IB-Ideen ohne Autorisierung übernimmt, ist keine IB World School. Die Programme selbst stehen unter IB."
  ),
  "international_status:pearson edexcel approved centre": article(
    false,
    "An approved Pearson centre is an organisation Pearson has approved to offer its qualifications, including International GCSE and International Advanced Level. Approval is required before a school can enter candidates for those exams. The syllabuses themselves are listed under the programme Pearson Edexcel.",
    "Одобренный центр Pearson — организация, которой Pearson разрешил предлагать свои квалификации, включая International GCSE и International Advanced Level. Без этого статуса школа не может заявлять учеников на такие экзамены. Сами программы стоят в пункте Pearson Edexcel.",
    "Pearson-ის დამტკიცებული ცენტრი ორგანიზაციაა, რომელსაც Pearson-მა თავისი კვალიფიკაციების, მათ შორის International GCSE-სა და International Advanced Level-ის, შეთავაზების უფლება მისცა. ამ სტატუსის გარეშე სკოლა მოსწავლეებს ასეთ გამოცდებზე ვერ წარადგენს. თავად პროგრამები პუნქტში Pearson Edexcel დგას.",
    "Ein anerkanntes Pearson-Centre ist eine Organisation, der Pearson erlaubt hat, seine Abschlüsse anzubieten, darunter International GCSE und International Advanced Level. Ohne diese Anerkennung darf eine Schule keine Prüflinge für diese Prüfungen anmelden. Die Lehrpläne selbst stehen unter dem Programm Pearson Edexcel."
  ),
  "international_status:international status not verified": article(
    true,
    "The catalog has not checked whether this school holds an international status such as IB World School, Cambridge International School or Pearson Edexcel Approved Centre. The mark is not a status granted by those organisations.",
    "Каталог не проверял, есть ли у школы международный статус вроде IB World School, Cambridge International School или Pearson Edexcel Approved Centre. Отметка не выдана этими организациями.",
    "კატალოგს არ შეუმოწმებია, აქვს თუ არა სკოლას საერთაშორისო სტატუსი, როგორიცაა IB World School, Cambridge International School ან Pearson Edexcel Approved Centre. ნიშანი ამ ორგანიზაციებს არ გაუციათ.",
    "Der Katalog hat nicht geprüft, ob diese Schule einen internationalen Status wie IB World School, Cambridge International School oder Pearson Edexcel Approved Centre hat. Die Markierung ist kein Status dieser Organisationen."
  ),
  "international_status:no confirmed international status": article(
    true,
    "No international status is confirmed for this school. The mark is a note in the catalog, not a status from the IB, Cambridge or Pearson.",
    "Подтверждённого международного статуса у школы нет. Это пометка каталога, а не статус от IB, Cambridge или Pearson.",
    "სკოლას დადასტურებული საერთაშორისო სტატუსი არ აქვს. ეს კატალოგის შენიშვნაა და არა სტატუსი IB-ისგან, Cambridge-ისგან ან Pearson-ისგან.",
    "Für diese Schule ist kein internationaler Status bestätigt. Die Markierung ist ein Hinweis im Katalog, kein Status des IB, von Cambridge oder von Pearson."
  ),
  "international_status:other": article(
    true,
    "The school’s international status does not match the named entries in this directory. The mark is not a status from the IB, Cambridge or Pearson.",
    "Международный статус школы не совпадает с названными пунктами этого справочника. Отметка не выдана IB, Cambridge или Pearson.",
    "სკოლის საერთაშორისო სტატუსი ამ ცნობარის დასახელებულ პუნქტებს არ ემთხვევა. ნიშანი IB-ს, Cambridge-ს ან Pearson-ს არ გაუცია.",
    "Der internationale Status der Schule entspricht keinem benannten Eintrag in diesem Verzeichnis. Die Markierung ist kein Status des IB, von Cambridge oder von Pearson."
  ),
  "accreditation:cognia": article(
    false,
    "Cognia accreditation is a voluntary quality review by Cognia, whose agencies include SACS CASI, NCA CASI and NWAC. A school shows that it meets Cognia’s standards and stays in regular review. Cognia decides the status after that review. It is not a government licence and does not by itself say which curriculum the school teaches. Cognia states that universities and education authorities in many countries recognise the status.",
    "Аккредитация Cognia — добровольная проверка качества организацией Cognia. В неё входят агентства SACS CASI, NCA CASI и NWAC. Школа показывает, что соответствует стандартам Cognia, и остаётся в регулярной проверке. Статус Cognia присваивает по итогам этой проверки. Это не государственная лицензия и само по себе не говорит, какую программу ведёт школа. Cognia указывает, что статус признают университеты и органы образования во многих странах.",
    "Cognia-ს აკრედიტაცია Cognia-ს ნებაყოფლობითი ხარისხის შემოწმებაა. მასში შედის სააგენტოები SACS CASI, NCA CASI და NWAC. სკოლა აჩვენებს, რომ Cognia-ს სტანდარტებს აკმაყოფილებს, და რეგულარულ შემოწმებაში რჩება. სტატუსს Cognia ამ შემოწმების შემდეგ ანიჭებს. ეს სახელმწიფო ლიცენზია არ არის და თავისთავად არ ამბობს, რომელ პროგრამას ასწავლის სკოლა. Cognia აღნიშნავს, რომ სტატუსს მრავალ ქვეყანაში უნივერსიტეტები და განათლების უწყებები აღიარებენ.",
    "Die Cognia-Akkreditierung ist eine freiwillige Qualitätsprüfung durch Cognia. Dazu gehören die Agenturen SACS CASI, NCA CASI und NWAC. Eine Schule zeigt, dass sie die Standards von Cognia erfüllt, und bleibt in regelmäßiger Prüfung. Cognia vergibt den Status nach dieser Prüfung. Es ist keine staatliche Lizenz und sagt für sich nicht, welchen Lehrplan die Schule unterrichtet. Cognia gibt an, dass Universitäten und Bildungsbehörden in vielen Ländern den Status anerkennen."
  ),
  "accreditation:authorized in georgia": article(
    false,
    "Authorization in Georgia is the state procedure by which a general education institution gains the status needed to issue an education document recognised by the state. The National Center for Educational Quality Enhancement carries it out. For general education schools the standards cover the school’s mission, its curriculum, the administrative and material support of teaching, and support for students. This is Georgian state authorization, not an international accreditation such as Cognia.",
    "Авторизация в Грузии — государственная процедура, после которой учреждение общего образования получает статус, нужный для выдачи документа об образовании, признанного государством. Её проводит Национальный центр развития качества образования. Для школ общего образования стандарты охватывают миссию школы, программу, административное и материальное обеспечение учёбы и поддержку учеников. Это государственная авторизация Грузии, а не международная аккредитация вроде Cognia.",
    "საქართველოში ავტორიზაცია სახელმწიფო პროცედურაა, რომლითაც ზოგადი განათლების დაწესებულება იღებს სტატუსს სახელმწიფოს მიერ აღიარებული განათლების დამადასტურებელი დოკუმენტის გასაცემად. მას განათლების ხარისხის განვითარების ეროვნული ცენტრი ახორციელებს. ზოგადი განათლების სკოლებისთვის სტანდარტები მოიცავს სკოლის მისიას, პროგრამას, სწავლების ადმინისტრაციულ და მატერიალურ უზრუნველყოფას და მოსწავლეების მხარდაჭერას. ეს საქართველოს სახელმწიფო ავტორიზაციაა და არა საერთაშორისო აკრედიტაცია, როგორიცაა Cognia.",
    "Die Autorisierung in Georgien ist das staatliche Verfahren, mit dem eine Einrichtung der allgemeinen Bildung den Status erhält, ein vom Staat anerkanntes Bildungsdokument auszustellen. Durchgeführt wird sie vom Nationalen Zentrum zur Entwicklung der Bildungsqualität. Für allgemeinbildende Schulen gelten Standards zu Auftrag der Schule, Lehrplan, administrativer und materieller Unterstützung des Unterrichts und Unterstützung der Schülerinnen und Schüler. Das ist die staatliche Autorisierung Georgiens, keine internationale Akkreditierung wie Cognia."
  ),
  "accreditation:no confirmed accreditation": article(
    true,
    "No external accreditation is confirmed for this school. The mark does not say whether the school has Georgian authorization, and it is not itself an accreditation.",
    "Подтверждённой внешней аккредитации у школы нет. Отметка не говорит, есть ли у школы грузинская авторизация, и сама аккредитацией не является.",
    "სკოლას დადასტურებული გარე აკრედიტაცია არ აქვს. ნიშანი არ ამბობს, აქვს თუ არა სკოლას ქართული ავტორიზაცია, და თავად აკრედიტაცია არ არის.",
    "Für diese Schule ist keine externe Akkreditierung bestätigt. Die Markierung sagt nicht, ob die Schule eine georgische Autorisierung hat, und ist selbst keine Akkreditierung."
  ),
  "accreditation:other": article(
    true,
    "The school’s accreditation does not match the named entries in this directory. The mark is not an accreditation body.",
    "Аккредитация школы не совпадает с названными пунктами этого справочника. Отметка сама не аккредитующая организация.",
    "სკოლის აკრედიტაცია ამ ცნობარის დასახელებულ პუნქტებს არ ემთხვევა. ნიშანი თავად აკრედიტაციის ორგანო არ არის.",
    "Die Akkreditierung der Schule entspricht keinem benannten Eintrag in diesem Verzeichnis. Die Markierung ist selbst keine Akkreditierungsstelle."
  ),
};

export function directoryArticle(kind: LookupKind, label: string): DirectoryArticle | null {
  return ARTICLES[`${kind}:${label.trim().toLowerCase()}`] ?? null;
}
