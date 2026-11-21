/**
 * Portfolio Data Configuration — Nopparut Wanjai (นพรุจ วันใจ)
 * Loaded globally as window.PORTFOLIO_DATA (compatible with classic <script> & file://)
 */
(function (global) {
    'use strict';

    const PORTFOLIO_DATA = {
        profile: {
            brand: 'BAS.PORTFOLIO',
            name: {
                th: 'นพรุจ วันใจ',
                en: 'Nopparut Wanjai'
            },
            englishName: 'Nopparut Wanjai',
            nickname: {
                th: 'บาส',
                en: 'Bas'
            },
            age: {
                th: '24 ปี',
                en: '24 Years'
            },
            birthDate: '07/04/2545',
            roleTitle: {
                th: 'IT Support • Hardware & Network • นักพัฒนาซอฟต์แวร์',
                en: 'IT Support • Hardware & Network • Software Developer'
            },
            phone: '063 - 7924168',
            socialId: '@baszaa0569',
            email: 'baszaa803@gmail.com',
            address: {
                th: '324/1 หมู่ 7 ต.พระบาท อ.เมือง จ.ลำปาง',
                en: '324/1 Moo 7, Phrabat, Mueang Lampang, Lampang'
            },
            photoUrl: 'assets/profile.jpg',
            pixelPhotoUrl: 'assets/profile-pixel.png'
        },

        themeAliases: {
            cyber: 'day',
            solar: 'sunset',
            emerald: 'night'
        },

        themes: {
            day: {
                key: 'day',
                name: 'Sunny Pelican Beach',
                label: { th: 'กลางวัน', en: 'Day' },
                icon: '☀️',
                primary: '#ffd166',
                secondary: '#38b2d6',
                accent: '#ef476f',
                bgHex: 0x9ad8f8,
                fogHex: 0x9ad8f8,
                skyBands: ['#2d7dd2', '#4ea5e8', '#7cc6f8', '#b5e3ff', '#fff3c4'],
                oceanDeep: '#18639e',
                oceanMid: '#2282c2',
                oceanShallow: '#38b2d6',
                oceanFoam: '#eefaff',
                sandLight: '#f3d08a',
                sandMid: '#dfb367',
                sandWet: '#b78b4b',
                ambientColor: 0xfff5e4,
                ambientIntensity: 0.92,
                sunColor: 0xfff0b3,
                sunIntensity: 1.05,
                lanternIntensity: 0.45,
                jellyOpacity: 0.25,
                starsOpacity: 0.0,
                cloudTint: 0xffffff,
                windowGlow: '#ffd875'
            },
            sunset: {
                key: 'sunset',
                name: 'Golden Hour Coast',
                label: { th: 'ยามเย็น', en: 'Sunset' },
                icon: '🌅',
                primary: '#ffb703',
                secondary: '#fb8500',
                accent: '#ff595e',
                bgHex: 0xf29f67,
                fogHex: 0xf29f67,
                skyBands: ['#3c2a5d', '#7b3e68', '#c85a53', '#f28d4b', '#ffe082'],
                oceanDeep: '#26355c',
                oceanMid: '#494978',
                oceanShallow: '#b85d63',
                oceanFoam: '#ffd494',
                sandLight: '#e3aa6b',
                sandMid: '#c4834c',
                sandWet: '#8f5838',
                ambientColor: 0xffb38a,
                ambientIntensity: 0.78,
                sunColor: 0xff9f45,
                sunIntensity: 1.15,
                lanternIntensity: 1.35,
                jellyOpacity: 0.45,
                starsOpacity: 0.22,
                cloudTint: 0xffc8a8,
                windowGlow: '#ffbc42'
            },
            night: {
                key: 'night',
                name: 'Moonlight Jellies',
                label: { th: 'กลางคืน', en: 'Night' },
                icon: '🌙',
                primary: '#7ef9ff',
                secondary: '#48bfe3',
                accent: '#f472b6',
                bgHex: 0x19284f,
                fogHex: 0x19284f,
                skyBands: ['#070b1a', '#0f1833', '#19284f', '#243b6b', '#325288'],
                oceanDeep: '#0a1e3c',
                oceanMid: '#102e54',
                oceanShallow: '#184775',
                oceanFoam: '#7ef9ff',
                sandLight: '#5a6380',
                sandMid: '#444b66',
                sandWet: '#2d354c',
                ambientColor: 0x6f8cc4,
                ambientIntensity: 0.56,
                sunColor: 0xd8e8ff,
                sunIntensity: 0.65,
                lanternIntensity: 2.25,
                jellyOpacity: 0.95,
                starsOpacity: 0.95,
                cloudTint: 0x4b6391,
                windowGlow: '#ffcf56'
            }
        },

        about: {
            th: 'เป็นบุคคลที่มีใจรักในการเรียนรู้ พร้อมปรับตัวกับเทคโนโลยีใหม่ๆ อยู่เสมอ มีทักษะในการวิเคราะห์และแก้ไขปัญหา โดยเฉพาะในด้านอุปกรณ์คอมพิวเตอร์ และต้องการพัฒนาตนเองอย่างต่อเนื่องในสายงานด้าน IT หรือเทคโนโลยี',
            en: 'A passionate learner who continuously adapts to new technologies, skilled in analyzing and troubleshooting computer hardware and IT systems, and dedicated to continuous growth in the IT and technology career path.'
        },

        skillsList: [
            {
                name: {
                    th: 'เรียนรู้สิ่งใหม่ได้เร็ว',
                    en: 'Fast Learner & Tech Adaptability'
                },
                tag: { th: 'การเรียนรู้', en: 'Learning' },
                level: 95
            },
            {
                name: {
                    th: 'สามารถซ่อม แก้ไขปัญหาเกี่ยวกับอุปกรณ์คอมพิวเตอร์',
                    en: 'Computer Hardware Repair & Troubleshooting'
                },
                tag: { th: 'ฮาร์ดแวร์', en: 'Hardware' },
                level: 92
            },
            {
                name: {
                    th: 'มีความรับผิดชอบ และสามารถทำงานร่วมกับผู้อื่นได้',
                    en: 'Responsibility & Teamwork'
                },
                tag: { th: 'การทำงานร่วมกัน', en: 'Teamwork' },
                level: 95
            },
            {
                name: {
                    th: 'มีทักษะพื้นฐานในการวิเคราะห์ และแก้ไขปัญหาเบื้องต้นด้าน IT',
                    en: 'IT Analysis, Server & Network Cabling'
                },
                tag: { th: 'ระบบ & เครือข่าย', en: 'IT & Network' },
                level: 88
            },
            {
                name: {
                    th: 'การเขียนโปรแกรม และ ทักษะการใช้ AI',
                    en: 'Programming & AI Skills'
                },
                tag: { th: 'การเขียนโปรแกรม & AI', en: 'Programming & AI' },
                level: 90
            }
        ],

        experience: [
            {
                org: {
                    th: 'แมนพาวเวอร์ กรุ๊ป.',
                    en: 'Manpower Group. (HP)'
                },
                orgSub: 'Manpower Group. (HP)',
                period: '2567 - 2568',
                role: {
                    th: 'พนักงานฝ่ายขายสินค้าไอที (IT Sales Representative)',
                    en: 'IT Sales Representative (HP)'
                },
                desc: {
                    th: 'ปฏิบัติงานในตำแหน่งพนักงานฝ่ายขาย มีหน้าที่ในการนำเสนอและจำหน่ายสินค้าไอที อาทิ คอมพิวเตอร์ ปริ้นเตอร์ แล็ปท็อป รวมถึงแนะนำสินค้าและบริการต่าง ๆ ให้กับลูกค้า พร้อมทั้งส่งเสริมการขายสินค้าตามที่บริษัทมอบหมาย',
                    en: 'Worked as an IT Sales Representative presenting and selling IT hardware including computers, printers, and laptops, advising customers on products and services, and driving sales targets assigned by the company.'
                },
                tags: ['IT Products (HP)', 'Computers & Laptops', 'Printers', 'Customer Consulting']
            },
            {
                org: {
                    th: 'โรงพยาบาลค่ายสุรศักดิ์',
                    en: 'Surasakmontri Hospital'
                },
                orgSub: 'Surasakmontri Hospital',
                period: '2565 - 2566',
                role: {
                    th: 'เจ้าหน้าที่แผนก IT (IT Department Officer)',
                    en: 'IT Department Officer'
                },
                desc: {
                    th: 'ทำงานในตำแหน่งเจ้าหน้าที่แผนก IT รับผิดชอบดูแลเซิร์ฟเวอร์และอุปกรณ์คอมพิวเตอร์ภายในองค์กร โดยมีหน้าที่หลักในการแก้ไขปัญหาเกี่ยวกับฮาร์ดแวร์ ซอฟต์แวร์ และระบบพื้นฐาน รวมถึงการเดินสายติดตั้งระบบเครือข่ายภายใน',
                    en: 'Served as an IT Department Officer maintaining organizational servers and computers, troubleshooting hardware, software, and core systems, and performing internal network cabling and installation.'
                },
                tags: ['IT Support', 'Server Maintenance', 'Hardware & Software', 'Network Cabling']
            },
            {
                org: {
                    th: 'คลินิก ทันตกรรมสไมล์โฟกัส',
                    en: 'Smile Focus Dental Clinic Lampang'
                },
                orgSub: 'Smile Focus Dental Clinic Lampang',
                period: '2561 - 2567',
                role: {
                    th: 'ผู้ช่วยทันตแพทย์ (Dental Assistant)',
                    en: 'Dental Assistant'
                },
                desc: {
                    th: 'ปฏิบัติงานในตำแหน่งผู้ช่วยทันตแพทย์ มีหน้าที่ช่วยเตรียมและส่งอุปกรณ์ให้ทันตแพทย์ขณะทำหัตถการ ดูดน้ำลายในช่องปาก ผสมวัสดุสำหรับยึดติดฟันปลอมและสะพานฟัน รวมถึงมีประสบการณ์ในการช่วยงานด้านการผ่าตัด เช่น การผ่าฟันคุดและการฝังรากเทียม',
                    en: 'Worked as a Dental Assistant preparing and handing instruments during procedures, operating suction, mixing dental bonding materials for dentures and bridges, and assisting in surgical operations such as wisdom tooth extractions and dental implants.'
                },
                tags: ['Clinical Assistance', 'Surgical Support', 'Precision & Care', 'Team Coordination']
            }
        ],

        education: {
            degree: {
                th: 'ปวส.',
                en: 'High Vocational Certificate (ปวส.)'
            },
            period: '2565 - 2566',
            institution: {
                th: 'วิทยาลัยอาชีวศึกษาลำปาง',
                en: 'Lampang Vocational College'
            },
            faculty: {
                th: 'คณะ : เทคโนโลยีสารสนเทศ',
                en: 'Faculty : Information Technology'
            },
            major: {
                th: 'สาขา : นักพัฒนาซอฟต์แวร์',
                en: 'Major : Software Developer'
            },
            gpa: {
                th: 'เกรด 2.59',
                en: 'GPA 2.59'
            }
        },

        i18n: {
            th: {
                nav: {
                    profile: 'โปรไฟล์',
                    aboutSkills: 'เกี่ยวกับ & ทักษะ',
                    experience: 'ประวัติการทำงาน',
                    education: 'การศึกษา',
                    contact: 'ติดต่อ'
                },
                controls: {
                    langBtn: 'EN',
                    viewBeach: 'ชมวิวทะเล 3D',
                    exitBeach: 'แสดงโปรไฟล์',
                    toggleAvatarReal: 'สลับเป็นโหมด Pixel',
                    toggleAvatarPixel: 'สลับเป็นรูปจริง'
                },
                hero: {
                    badge: 'IT Support • Hardware • Software Developer',
                    personalTitle: 'ประวัติส่วนตัว',
                    nicknameLabel: 'ชื่อเล่น',
                    ageLabel: 'อายุ',
                    birthLabel: 'วันเกิด',
                    ctaExperience: 'ดูประวัติการทำงาน',
                    ctaContact: 'ข้อมูลติดต่อ',
                    oceanHint: 'ลากพื้นหลังเพื่อหมุนมุมมองทะเล 3D • ดับเบิลคลิกที่ฉากเพื่อเปลี่ยนเวลา เช้า/เย็น/กลางคืน'
                },
                aboutSection: {
                    eyebrow: '01 / ABOUT ME & SKILLS',
                    title: 'เกี่ยวกับฉัน & ทักษะเพิ่มเติม',
                    aboutTitle: 'เกี่ยวกับฉัน',
                    skillsTitle: 'ทักษะเพิ่มเติม'
                },
                experienceSection: {
                    eyebrow: '02 / WORK EXPERIENCE',
                    title: 'ประวัติการทำงาน',
                    subtitle: 'ประสบการณ์จริงทั้งด้าน IT Support, งานระบบเครือข่าย, งานขายสินค้าไอที และการประสานงาน'
                },
                educationSection: {
                    eyebrow: '03 / EDUCATION',
                    title: 'การศึกษา'
                },
                contactSection: {
                    eyebrow: '04 / CONTACT',
                    title: 'ติดต่อ',
                    subtitle: 'พร้อมพูดคุยเรื่องงานด้าน IT Support, ซ่อมบำรุงคอมพิวเตอร์, ระบบเครือข่าย และการพัฒนาซอฟต์แวร์',
                    phoneLabel: 'เบอร์โทรศัพท์',
                    socialLabel: 'โซเชียล / LINE ID',
                    addressLabel: 'ที่อยู่',
                    emailLabel: 'อีเมล',
                    copyBtn: 'คัดลอก',
                    copiedToast: 'คัดลอกข้อมูลแล้ว: '
                },
                footer: {
                    note: 'นพรุจ วันใจ (Nopparut Wanjai) • สร้างด้วย HTML5, CSS3, Three.js Pixel Ocean & Vanilla JavaScript'
                }
            },
            en: {
                nav: {
                    profile: 'Profile',
                    aboutSkills: 'About & Skills',
                    experience: 'Experience',
                    education: 'Education',
                    contact: 'Contact'
                },
                controls: {
                    langBtn: 'TH',
                    viewBeach: '3D Beach View',
                    exitBeach: 'Show Profile',
                    toggleAvatarReal: 'Switch to Pixel Avatar',
                    toggleAvatarPixel: 'Switch to Real Photo'
                },
                hero: {
                    badge: 'IT Support • Hardware • Software Developer',
                    personalTitle: 'Personal Profile',
                    nicknameLabel: 'Nickname',
                    ageLabel: 'Age',
                    birthLabel: 'Birth Date',
                    ctaExperience: 'View Experience',
                    ctaContact: 'Contact Me',
                    oceanHint: 'Drag background to orbit the 3D pixel beach • Double-click backdrop to switch Day / Sunset / Night'
                },
                aboutSection: {
                    eyebrow: '01 / ABOUT ME & SKILLS',
                    title: 'About Me & Additional Skills',
                    aboutTitle: 'About Me',
                    skillsTitle: 'Additional Skills'
                },
                experienceSection: {
                    eyebrow: '02 / WORK EXPERIENCE',
                    title: 'Work Experience',
                    subtitle: 'Hands-on experience across IT Support, network cabling, IT sales, and clinical coordination'
                },
                educationSection: {
                    eyebrow: '03 / EDUCATION',
                    title: 'Education'
                },
                contactSection: {
                    eyebrow: '04 / CONTACT',
                    title: 'Contact',
                    subtitle: 'Open for IT Support, hardware troubleshooting, network administration, and software opportunities',
                    phoneLabel: 'Phone',
                    socialLabel: 'Social / ID',
                    addressLabel: 'Address',
                    emailLabel: 'Email',
                    copyBtn: 'Copy',
                    copiedToast: 'Copied: '
                },
                footer: {
                    note: 'Nopparut Wanjai • Built with HTML5, CSS3, Three.js Pixel Ocean & Vanilla JavaScript'
                }
            }
        }
    };

    global.PORTFOLIO_DATA = PORTFOLIO_DATA;
})(window);
