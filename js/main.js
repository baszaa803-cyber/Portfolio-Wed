/**
 * Portfolio UI Controller — Nopparut Wanjai (นพรุจ วันใจ)
 * Connects resume data (js/data.js) with the Stardew Valley Pixel Ocean 3D background (js/scene3d.js).
 */
(function (global) {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const DATA = global.PORTFOLIO_DATA;
        if (!DATA) {
            console.error('[Main] PORTFOLIO_DATA is missing.');
            return;
        }

        const state = {
            lang: 'th',
            theme: 'day',
            beachViewMode: false
        };

        const els = {
            brandName: document.getElementById('brand-name'),
            btnTime: document.getElementById('btn-time'),
            timeIcon: document.getElementById('time-icon'),
            timeLabel: document.getElementById('time-label'),
            btnLang: document.getElementById('btn-lang'),
            btnViewBeach: document.getElementById('btn-view-beach'),
            viewBeachLabel: document.getElementById('view-beach-label'),
            btnMobileMenu: document.getElementById('btn-mobile-menu'),
            navLinksWrap: document.getElementById('nav-links'),
            navLinks: document.querySelectorAll('.nav-link'),

            profileAvatar: document.getElementById('profile-avatar'),
            heroRoleBadge: document.getElementById('hero-role-badge'),
            profileNameTh: document.getElementById('profile-name-th'),
            profileNameEn: document.getElementById('profile-name-en'),
            valNickname: document.getElementById('val-nickname'),
            valAge: document.getElementById('val-age'),
            valBirth: document.getElementById('val-birth'),
            heroAboutSummary: document.getElementById('hero-about-summary'),

            aboutFullText: document.getElementById('about-full-text'),
            skillsList: document.getElementById('skills-list'),
            experienceList: document.getElementById('experience-list'),
            educationCardWrap: document.getElementById('education-card-wrap'),
            contactGrid: document.getElementById('contact-grid'),
            toast: document.getElementById('toast')
        };

        // Initialize Stardew Valley Pixel Ocean 3D Scene
        const scene3d = new global.PortfolioScene3D({
            canvasId: 'webgl-canvas',
            themes: DATA.themes || {},
            initialTheme: state.theme
        });
        global.portfolio3D = scene3d;

        // Toast Helper
        let toastTimer = null;
        function showToast(message) {
            if (!els.toast) return;
            els.toast.textContent = message;
            els.toast.classList.add('show');
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(function () {
                els.toast.classList.remove('show');
            }, 2600);
        }

        function copyText(text) {
            const dict = DATA.i18n[state.lang];
            const msg = dict.contactSection.copiedToast + text;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    showToast(msg);
                }).catch(function () {
                    fallbackCopy(text, msg);
                });
            } else {
                fallbackCopy(text, msg);
            }
        }

        function fallbackCopy(text, msg) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                showToast(msg);
            } catch (err) {
                showToast(text);
            }
            document.body.removeChild(ta);
        }

        function getI18nValue(dict, path) {
            const parts = path.split('.');
            let cur = dict;
            for (let i = 0; i < parts.length; i++) {
                if (cur && Object.prototype.hasOwnProperty.call(cur, parts[i])) {
                    cur = cur[parts[i]];
                } else {
                    return null;
                }
            }
            return cur;
        }

        function syncTimeBadge() {
            const curKey = document.documentElement.getAttribute('data-theme') || state.theme;
            const themeObj = DATA.themes[curKey] || DATA.themes.day;
            state.theme = themeObj.key;
            if (els.timeIcon) els.timeIcon.textContent = themeObj.icon || '☀️';
            if (els.timeLabel && themeObj.label) {
                els.timeLabel.textContent = themeObj.label[state.lang] || themeObj.name;
            }
        }

        function renderSkills() {
            if (!els.skillsList) return;
            els.skillsList.innerHTML = DATA.skillsList.map(function (sk) {
                return `
                    <div class="skill-item">
                        <div class="skill-head">
                            <span class="skill-label">&bull; ${sk.name[state.lang]}</span>
                            <span class="skill-pct">${sk.level}%</span>
                        </div>
                        <div class="skill-track">
                            <div class="skill-fill" style="width: ${sk.level}%;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderExperience() {
            if (!els.experienceList) return;
            els.experienceList.innerHTML = DATA.experience.map(function (job) {
                const tagsHtml = job.tags.map(function (t) {
                    return `<span class="pixel-tag">${t}</span>`;
                }).join('');
                const showSub = state.lang === 'th' && job.orgSub && job.orgSub !== job.org.th;
                return `
                    <article class="exp-item">
                        <span class="exp-dot" aria-hidden="true"></span>
                        <div class="glass-card exp-card" data-ui-interactive>
                            <div class="exp-top">
                                <h3 class="exp-org">${job.org[state.lang]}</h3>
                                <span class="exp-period">${job.period}</span>
                            </div>
                            <p class="exp-sub">${showSub ? job.orgSub + ' • ' : ''}${job.role[state.lang]}</p>
                            <p class="exp-desc">${job.desc[state.lang]}</p>
                            <div class="exp-tags">${tagsHtml}</div>
                        </div>
                    </article>
                `;
            }).join('');
        }

        function renderEducation() {
            if (!els.educationCardWrap) return;
            const edu = DATA.education;
            els.educationCardWrap.innerHTML = `
                <article class="glass-card education-card" data-ui-interactive>
                    <div>
                        <div class="edu-degree-row">
                            <span class="edu-degree">${edu.degree[state.lang]}</span>
                            <span class="exp-period">${edu.period}</span>
                        </div>
                        <h3 class="edu-school">${edu.institution[state.lang]}</h3>
                        <p class="edu-details">${edu.faculty[state.lang]} &nbsp;|&nbsp; ${edu.major[state.lang]}</p>
                    </div>
                    <div class="edu-gpa-box">
                        <span class="edu-gpa-label">GPA</span>
                        <strong class="edu-gpa-val">${edu.gpa[state.lang]}</strong>
                    </div>
                </article>
            `;
        }

        function renderContact() {
            if (!els.contactGrid) return;
            const dict = DATA.i18n[state.lang].contactSection;
            const p = DATA.profile;

            const items = [
                {
                    icon: '📞',
                    label: dict.phoneLabel,
                    value: p.phone,
                    copyVal: p.phone.replace(/\s+/g, '')
                },
                {
                    icon: '👤',
                    label: dict.socialLabel,
                    value: p.socialId,
                    copyVal: p.socialId
                },
                {
                    icon: '📍',
                    label: dict.addressLabel,
                    value: p.address[state.lang],
                    copyVal: p.address[state.lang]
                },
                {
                    icon: '✉️',
                    label: dict.emailLabel,
                    value: p.email,
                    copyVal: p.email
                }
            ];

            els.contactGrid.innerHTML = items.map(function (item, idx) {
                return `
                    <article class="glass-card contact-card" data-ui-interactive>
                        <div>
                            <div class="contact-icon" aria-hidden="true">${item.icon}</div>
                            <span class="contact-label">${item.label}</span>
                            <p class="contact-value">${item.value}</p>
                        </div>
                        <button type="button" class="btn btn-ghost btn-sm btn-copy-contact" data-copy-idx="${idx}">
                            ${dict.copyBtn}
                        </button>
                    </article>
                `;
            }).join('');

            const copyBtns = els.contactGrid.querySelectorAll('.btn-copy-contact');
            copyBtns.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const idx = parseInt(btn.dataset.copyIdx, 10);
                    if (items[idx]) {
                        copyText(items[idx].copyVal);
                    }
                });
            });
        }

        function applyLanguage(lang) {
            state.lang = lang === 'en' ? 'en' : 'th';
            const dict = DATA.i18n[state.lang];
            document.documentElement.lang = state.lang;

            if (els.brandName) els.brandName.textContent = DATA.profile.brand;
            if (els.btnLang) els.btnLang.textContent = dict.controls.langBtn;

            document.querySelectorAll('[data-i18n]').forEach(function (node) {
                const key = node.getAttribute('data-i18n');
                const val = getI18nValue(dict, key);
                if (typeof val === 'string') {
                    node.textContent = val;
                }
            });

            if (els.viewBeachLabel) {
                els.viewBeachLabel.textContent = state.beachViewMode
                    ? dict.controls.exitBeach
                    : dict.controls.viewBeach;
            }

            if (els.heroRoleBadge) els.heroRoleBadge.textContent = DATA.profile.roleTitle[state.lang];
            if (els.profileNameTh) {
                els.profileNameTh.textContent = state.lang === 'th'
                    ? DATA.profile.name.th
                    : DATA.profile.name.en;
            }
            if (els.profileNameEn) {
                els.profileNameEn.textContent = state.lang === 'th'
                    ? DATA.profile.name.en
                    : DATA.profile.name.th;
            }
            if (els.valNickname) els.valNickname.textContent = DATA.profile.nickname[state.lang];
            if (els.valAge) els.valAge.textContent = DATA.profile.age[state.lang];
            if (els.valBirth) els.valBirth.textContent = DATA.profile.birthDate;
            if (els.heroAboutSummary) els.heroAboutSummary.textContent = DATA.about[state.lang];
            if (els.aboutFullText) els.aboutFullText.textContent = DATA.about[state.lang];

            syncTimeBadge();
            if (els.profileAvatar) els.profileAvatar.src = DATA.profile.photoUrl;
            renderSkills();
            renderExperience();
            renderEducation();
            renderContact();
        }

        function setBeachViewMode(enabled) {
            state.beachViewMode = Boolean(enabled);
            document.body.classList.toggle('focus-3d-mode', state.beachViewMode);
            const dict = DATA.i18n[state.lang];
            if (els.viewBeachLabel) {
                els.viewBeachLabel.textContent = state.beachViewMode
                    ? dict.controls.exitBeach
                    : dict.controls.viewBeach;
            }
        }

        // Event Listeners: Navbar Controls
        if (els.btnTime) {
            els.btnTime.addEventListener('click', function () {
                const nextKey = scene3d.cycleTheme();
                state.theme = nextKey;
                syncTimeBadge();
            });
        }

        // Sync badge even when user double-clicks canvas directly
        if ('MutationObserver' in global) {
            const themeObserver = new MutationObserver(function () {
                syncTimeBadge();
            });
            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme']
            });
        }

        if (els.btnLang) {
            els.btnLang.addEventListener('click', function () {
                applyLanguage(state.lang === 'th' ? 'en' : 'th');
            });
        }

        if (els.btnViewBeach) {
            els.btnViewBeach.addEventListener('click', function () {
                setBeachViewMode(!state.beachViewMode);
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && state.beachViewMode) {
                setBeachViewMode(false);
            }
        });

        if (els.btnMobileMenu && els.navLinksWrap) {
            els.btnMobileMenu.addEventListener('click', function () {
                const isOpen = els.navLinksWrap.classList.toggle('open');
                els.btnMobileMenu.setAttribute('aria-expanded', String(isOpen));
            });

            els.navLinks.forEach(function (link) {
                link.addEventListener('click', function () {
                    els.navLinksWrap.classList.remove('open');
                    els.btnMobileMenu.setAttribute('aria-expanded', 'false');
                });
            });
        }

        // Reveal on scroll + Scroll-Spy
        if ('IntersectionObserver' in global) {
            const revealObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.reveal').forEach(function (el) {
                revealObserver.observe(el);
            });

            const spyObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        els.navLinks.forEach(function (link) {
                            link.classList.toggle('active', link.dataset.section === id);
                        });
                    }
                });
            }, { rootMargin: '-40% 0px -45% 0px' });

            document.querySelectorAll('section[id]').forEach(function (sec) {
                spyObserver.observe(sec);
            });
        } else {
            document.querySelectorAll('.reveal').forEach(function (el) {
                el.classList.add('visible');
            });
        }

        // Bootstrap UI
        scene3d.setTheme(state.theme);
        applyLanguage(state.lang);
    });
})(window);
