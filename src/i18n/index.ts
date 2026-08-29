import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        map: 'Map',
        catalog: 'Catalog',
        directory: 'Directory',
        about: 'About',
      },
      directory: {
        title: 'Schools Directory',
        content: 'Tbilisi Schools Directory is your guide to the city\'s educational system. Here we have collected information about types of schools (public, private, international), languages of instruction, curricula, and the admission process. We constantly update this section to provide you with the most up-to-date information.',
        curricula: {
          title: 'Educational Programs (Curricula)',
          ib: {
            title: 'IB (International Baccalaureate)',
            content: 'An international program with a single standard worldwide. It is built around developing thinking skills: children learn to analyze, write essays, work with projects, and connect different subjects. In primary years (PYP), learning is gentle and inquiry-based, while in diploma years (DP), it is one of the most challenging school programs. It is the most "universal" system: well-suited for relocations and entering EU universities.'
          },
          british: {
            title: 'British (UK curriculum — IGCSE / A-Level)',
            content: 'A classic academic model with a clear structure and exams. Until 14–16 years old, children study a wide range of subjects, then move to IGCSE and further to A-Level, where they choose 3–4 subjects and go deep into them. It is a more "predictable" and understandable system than IB: fewer projects, more structure and control.'
          },
          american: {
            title: 'American (US curriculum / High School + AP)',
            content: 'The most flexible system: students study a wide range of subjects, grades accumulate over several years, with many projects and extracurricular activities. In high school, one can take AP (Advanced Placement) — advanced subjects for university preparation. It is the most "comfortable" system, with less stress and more variability. However, it is less standardized than IB and British.'
          },
          finnish: {
            title: 'Finnish (Finnish system)',
            content: 'About gentle, humane education. There are minimum tests and pressure, emphasis on the child\'s interest, projects, and skill development rather than rote learning. Often uses "phenomenon-based learning" — learning through real topics rather than separate subjects. This is the best option for adaptation and psychological comfort, especially when moving. However, the academic load is lower, so a transition to a "tougher" system is often required later.'
          },
          progressive: {
            title: 'Progressive / Alternative',
            content: 'Built on an individual approach, project-based learning, flexible curriculum, and soft skills development. This is a very modern format: well-suited for adaptation, creative children, and a soft entry into an English-speaking environment. However, it is not a standardized system, so a transition to IB or British is almost always needed at some point.'
          },
          hybrid: {
            title: 'Georgian + International (Hybrid)',
            content: 'Many schools in Tbilisi are a hybrid: Georgian national curriculum + international elements. Part of the program is Georgian, part is in English, and sometimes IB / American elements are added. This is a compromise option: cheaper, easier to enter, easier to adapt. But: the level and language can vary significantly, and it is not a full-fledged international system.'
          }
        }
      },
      about: {
        title: 'About the Project',
        content: 'This project was created for convenient searching of schools in Tbilisi. It combines information about various educational institutions, including international and local schools, and allows you to quickly find them on the map. The project is in a development stage — in the future, we plan to add filters, reviews, ratings, and additional information about schools.',
      },
      map: {
        loading: 'Loading map...',
        error: 'Error loading schools data',
        schoolName: 'School Name',
        address: 'Address',
        languages: 'Languages of Instruction',
      },
      catalog: {
        cost: 'Cost',
        program: 'Program',
        comment: 'Comment',
        back: 'Back to list',
      },
    },
  },
  ge: {
    translation: {
      nav: {
        map: 'რუკა',
        catalog: 'კატალოგი',
        directory: 'ცნობარი',
        about: 'პროექტის შესახებ',
      },
      directory: {
        title: 'სკოლების ცნობარი',
        content: 'თბილისის სკოლების ცნობარი არის თქვენი მეგზური ქალაქის საგანმანათლებლო სისტემაში. აქ ჩვენ შევაგროვეთ ინფორმაცია სკოლების ტიპების (საჯარო, კერძო, საერთაშორისო), სწავლების ენების, სასწავლო პროგრამებისა და მიღების პროცესის შესახებ. ჩვენ მუდმივად ვაახლებთ ამ განყოფილებას, რათა მოგაწოდოთ ყველაზე აქტუალური ინფორმაცია.',
        curricula: {
          title: 'საგანმანათლებლო პროგრამები',
          ib: {
            title: 'IB (International Baccalaureate)',
            content: 'საერთაშორისო პროგრამა ერთიანი სტანდარტით მთელ მსოფლიოში. იგი აგებულია აზროვნების განვითარებაზე: ბავშვები სწავლობენ ანალიზს, ესეების წერას, პროექტებზე მუშაობას და სხვადასხვა საგნების ერთმანეთთან დაკავშირებას. დაწყებით კლასებში (PYP) სწავლება რბილი და კვლევითია, ხოლო უფროს კლასებში (DP) — ერთ-ერთი ყველაზე რთული სასკოლო პროგრამა. ეს არის ყველაზე „უნივერსალური“ სისტემა: კარგად შეეფერება გადაადგილებას და ევროკავშირში ჩაბარებას.'
          },
          british: {
            title: 'British (UK curriculum — IGCSE / A-Level)',
            content: 'კლასიკური აკადემიური მოდელი მკაფიო სტრუქტურითა და გამოცდებით. 14–16 წლამდე ბავშვები სწავლობენ საგნების ფართო სპექტრს, შემდეგ გადადიან IGCSE-ზე და შემდგომ A-Level-ზე, სადაც უკვე ირჩევენ 3–4 საგანს და სიღრმისეულად სწავლობენ მათ. ეს არის უფრო „პროგნოზირებადი“ და გასაგები სისტემა, ვიდრე IB: ნაკლები პროექტი, მეტი სტრუქტურა და კონტროლი.'
          },
          american: {
            title: 'American (US curriculum / High School + AP)',
            content: 'ყველაზე მოქნილი სისტემა: მოსწავლეები სწავლობენ საგნების ფართო სპექტრს, ნიშნები გროვდება რამდენიმე წლის განმავლობაში, ბევრია პროექტები და კლასგარეშე აქტივობები. უფროს კლასებში შესაძლებელია AP (Advanced Placement) — გაძლიერებული საგნების აღება უნივერსიტეტისთვის მოსამზადებლად. ეს არის ყველაზე „კომფორტული“ სისტემა, ნაკლები სტრესითა და მეტი ვარიაციით. თუმცა, ის ნაკლებად სტანდარტიზებულია, ვიდრე IB და British.'
          },
          finnish: {
            title: 'Finnish (ფინური სისტემა)',
            content: 'რბილი, ჰუმანური განათლების შესახებ. აქ არის მინიმალური ტესტები და წნეხი, აქცენტი კეთდება ბავშვის ინტერესზე, პროექტებსა და უნარების განვითარებაზე. ხშირად გამოიყენება „phenomenon-based learning“ — სწავლება რეალური თემების მეშვეობით და არა ცალკეული საგნებით. ეს საუკეთესო ვარიანტია ადაპტაციისა და ფსიქოლოგიური კომფორტისთვის, განსაკუთრებით გადასვლისას. თუმცა, აკადემიური დატვირთვა დაბალია, ამიტომ მოგვიანებით ხშირად საჭიროა უფრო „მკაცრ“ სისტემაზე გადასვლა.'
          },
          progressive: {
            title: 'Progressive / Alternative',
            content: 'აგებულია ინდივიდუალურ მიდგომაზე, პროექტულ სწავლებაზე, მოქნილ პროგრამასა და soft skills-ის განვითარებაზე. ეს არის ძალიან თანამედროვე ფორმატი: კარგად შეეფერება ადაპტაციას, კრეატიულ ბავშვებს და ინგლისურ გარემოში რბილ შესვლას. თუმცა, ეს არ არის სტანდარტიზებული სისტემა, ამიტომ რაღაც მომენტში თითქმის ყოველთვის საჭიროა IB-ზე ან British-ზე გადასვლა.'
          },
          hybrid: {
            title: 'Georgian + International (ჰიბრიდული)',
            content: 'თბილისში ბევრი სკოლა ჰიბრიდულია: ქართული ეროვნული სასწავლო გეგმა + საერთაშორისო ელემენტები. პროგრამის ნაწილი ქართულია, ნაწილი — ინგლისურენოვანი, ზოგჯერ დამატებულია IB / American ელემენტები. ეს არის კომპრომისული ვარიანტი: უფრო იაფია, უფრო ადვილია ჩაბარება, უფრო ადვილია ადაპტაცია. მაგრამ: დონე და ენა შეიძლება მნიშვნელოვნად მერყეობდეს და ეს არ არის სრულფასოვანი საერთაშორისო სისტემა.'
          }
        }
      },
      about: {
        title: 'პროექტის შესახებ',
        content: 'ეს პროექტი შეიქმნა თბილისში სკოლების მოსახერხებელი ძიებისთვის. ის აერთიანებს ინფორმაციას სხვადასხვა საგანმანათლებლო დაწესებულების შესახებ, მათ შორის საერთაშორისო და ადგილობრივ სკოლებს, და საშუალებას გაძლევთ სწრაფად იპოვოთ ისინი რუკაზე. პროექტი განვითარების ეტაპზეა — მომავალში ვგეგმავთ ფილტრების, მიმოხილვების, რეიტინგებისა და სკოლების შესახებ დამატებითი ინფორმაციის დამატებას.',
      },
      map: {
        loading: 'რუკა იტვირთება...',
        error: 'შეცდომა სკოლების მონაცემების ჩატვირთვისას',
        schoolName: 'სკოლის სახელი',
        address: 'მისამართი',
        languages: 'სწავლების ენები',
      },
      catalog: {
        cost: 'ღირებულება',
        program: 'პროგრამა',
        comment: 'კომენტარი',
        back: 'სიაში დაბრუნება',
      },
    },
  },
  ru: {
    translation: {
      nav: {
        map: 'Карта',
        catalog: 'Каталог',
        directory: 'Справочник',
        about: 'О проекте',
      },
      directory: {
        title: 'Справочник школ',
        content: 'Справочник школ Тбилиси — это ваш путеводитель по образовательной системе города. Здесь мы собрали информацию о типах школ (государственные, частные, международные), языках обучения, учебных программах и процессе поступления. Мы постоянно обновляем этот раздел, чтобы предоставить вам самую актуальную информацию.',
        curricula: {
          title: 'Образовательные программы (Curricula)',
          ib: {
            title: 'IB (International Baccalaureate)',
            content: 'Это международная программа с единым стандартом во всём мире. Она строится вокруг развития мышления: дети учатся анализировать, писать эссе, работать с проектами и связывать разные предметы между собой. В младших классах (PYP) обучение мягкое и исследовательское, а в старших (DP) — одна из самых сложных школьных программ. Это наиболее “универсальная” система: хорошо подходит для переездов и поступления в ЕС.'
          },
          british: {
            title: 'British (UK curriculum — IGCSE / A-Level)',
            content: 'Британская система — это классическая академическая модель с чёткой структурой и экзаменами. До 14–16 лет дети изучают широкий набор предметов, а затем переходят к IGCSE и дальше A-Level, где уже выбирают 3–4 предмета и углубляются в них. Это более “предсказуемая” и понятная система, чем IB: меньше проектов, больше структуры и контроля.'
          },
          american: {
            title: 'American (US curriculum / High School + AP)',
            content: 'Американская система — самая гибкая: ученики изучают широкий набор предметов, оценки накапливаются за несколько лет, много проектов и внеклассной активности. В старших классах можно брать AP (Advanced Placement) — усложнённые предметы для подготовки к университету. Это самая “комфортная” система, с меньшим стрессом и большей вариативностью. Но она хуже стандартизирована, чем IB и British.'
          },
          finnish: {
            title: 'Finnish (финская система)',
            content: 'Финская система — это про мягкое, гуманное образование. Здесь минимум тестов и давления, упор на интерес ребёнка, проекты и развитие навыков, а не зубрёжку. Часто используется “phenomenon-based learning” — обучение через реальные темы, а не отдельные предметы. Это лучший вариант для адаптации и психологического комфорта, особенно при переезде. Но академическая нагрузка ниже, поэтому позже часто требуется переход в более “жёсткую” систему.'
          },
          progressive: {
            title: 'Progressive / Alternative',
            content: 'Такие школы строятся на индивидуальном подходе, проектном обучении, гибкой программе и развитии soft skills. Это очень современный формат: хорошо подходит для адаптации, креативных детей и мягкого входа в английскую среду. Но это не стандартизированная система, поэтому в какой-то момент почти всегда нужен переход в IB или British.'
          },
          hybrid: {
            title: 'Georgian + International (гибридные)',
            content: 'Многие школы в Тбилиси — это гибрид: Georgian national curriculum + international elements. То есть часть программы — грузинская, часть — на английском, иногда добавлены IB / American элементы. Это компромиссный вариант: дешевле, проще поступить, легче адаптироваться. Но: уровень и язык могут сильно “плавать”, и это не полноценная международная система.'
          }
        }
      },
      about: {
        title: 'О проекте',
        content: 'Данный проект создан для удобного поиска школ в Тбилиси. Он объединяет информацию о различных учебных заведениях, включая международные и локальные школы, и позволяет быстро найти их на карте. Проект находится в стадии развития — в будущем планируется добавление фильтров, отзывов, рейтингов и дополнительной информации о школах.',
      },
      map: {
        loading: 'Загрузка карты...',
        error: 'Ошибка загрузки данных о школах',
        schoolName: 'Название школы',
        address: 'Адрес',
        languages: 'Языки обучения',
      },
      catalog: {
        cost: 'Стоимость',
        program: 'Программа',
        comment: 'Комментарий',
        back: 'Назад к списку',
      },
    },
  },
  de: {
    translation: {
      nav: {
        map: 'Karte',
        catalog: 'Katalog',
        directory: 'Verzeichnis',
        about: 'Über das Projekt',
      },
      directory: {
        title: 'Schulverzeichnis',
        content: 'Das Schulverzeichnis von Tiflis ist Ihr Leitfaden für das Bildungssystem der Stadt. Hier haben wir Informationen über Schultypen (öffentlich, privat, international), Unterrichtssprachen, Lehrpläne und das Aufnahmeverfahren zusammengestellt. Wir aktualisieren diesen Abschnitt ständig, um Ihnen die aktuellsten Informationen zur Verfügung zu stellen.',
        curricula: {
          title: 'Bildungsprogramme (Curricula)',
          ib: {
            title: 'IB (International Baccalaureate)',
            content: 'Ein internationales Programm mit einem weltweit einheitlichen Standard. Es konzentriert sich auf die Entwicklung des Denkens: Kinder lernen zu analysieren, Essays zu schreiben, an Projekten zu arbeiten und verschiedene Fächer miteinander zu verknüpfen. In den unteren Klassen (PYP) ist das Lernen sanft und forschend, in den oberen Klassen (DP) ist es eines der anspruchsvollsten Schulprogramme. Dies ist das "universellste" System: gut geeignet für Umzüge und den Eintritt in die EU.'
          },
          british: {
            title: 'British (UK curriculum — IGCSE / A-Level)',
            content: 'Ein klassisches akademisches Modell mit klarer Struktur und Prüfungen. Bis zum Alter von 14–16 Jahren lernen die Kinder ein breites Spektrum an Fächern, wechseln dann zu IGCSE und weiter zu A-Level, wo sie 3–4 Fächer wählen und diese vertiefen. Dies ist ein "vorhersehbareres" und verständlicheres System als IB: weniger Projekte, mehr Struktur und Kontrolle.'
          },
          american: {
            title: 'American (US curriculum / High School + AP)',
            content: 'Das flexibelste System: Die Schüler lernen ein breites Spektrum an Fächern, die Noten werden über mehrere Jahre gesammelt, es gibt viele Projekte und außerschulische Aktivitäten. In der High School kann man AP (Advanced Placement) wählen — vertiefte Fächer zur Vorbereitung auf die Universität. Dies ist das "bequemste" System mit weniger Stress und größerer Variabilität. Es ist jedoch weniger standardisiert als IB und British.'
          },
          finnish: {
            title: 'Finnish (Finnisches System)',
            content: 'Steht für eine sanfte, humane Bildung. Es gibt ein Minimum an Tests und Druck, der Schwerpunkt liegt auf dem Interesse des Kindes, Projekten und der Entwicklung von Fähigkeiten statt Auswendiglernen. Oft wird "phenomenon-based learning" eingesetzt — Lernen durch reale Themen statt einzelner Fächer. Dies ist die beste Option für Anpassung und psychologischen Komfort, insbesondere bei einem Umzug. Die akademische Belastung ist jedoch geringer, sodass später oft ein Wechsel in ein "härteres" System erforderlich ist.'
          },
          progressive: {
            title: 'Progressive / Alternative',
            content: 'Basiert auf einem individuellen Ansatz, projektbasiertem Lernen, einem flexiblen Lehrplan und der Entwicklung von Soft Skills. Dies ist ein sehr modernes Format: gut geeignet für die Anpassung, kreative Kinder und einen sanften Einstieg in ein englischsprachiges Umfeld. Es ist jedoch kein standardisiertes System, sodass irgendwann fast immer ein Wechsel zu IB oder British erforderlich ist.'
          },
          hybrid: {
            title: 'Georgian + International (Hybrid)',
            content: 'Viele Schulen in Tiflis sind ein Hybrid: georgischer nationaler Lehrplan + internationale Elemente. Ein Teil des Programms ist georgisch, ein Teil auf Englisch, manchmal werden IB- oder amerikanische Elemente hinzugefügt. Dies ist eine Kompromisslösung: günstiger, einfacherer Eintritt, leichtere Anpassung. Aber: Das Niveau und die Sprache können stark schwanken, und es ist kein vollwertiges internationales System.'
          }
        }
      },
      about: {
        title: 'Über das Projekt',
        content: 'Dieses Projekt wurde für die bequeme Suche nach Schulen in Tiflis erstellt. Es bündelt Informationen über verschiedene Bildungseinrichtungen, einschließlich internationaler und lokaler Schulen, und ermöglicht es Ihnen, diese schnell auf der Karte zu finden. Das Projekt befindet sich in der Entwicklungsphase — in Zukunft planen wir, Filter, Bewertungen, Ratings und zusätzliche Informationen über Schulen hinzuzufügen.',
      },
      map: {
        loading: 'Karte wird geladen...',
        error: 'Fehler beim Laden der Schuldaten',
        schoolName: 'Schulname',
        address: 'Adresse',
        languages: 'Unterrichtssprachen',
      },
      catalog: {
        cost: 'Kosten',
        program: 'Programm',
        comment: 'Kommentar',
        back: 'Zurück zur Liste',
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
