const BING_AUTOSEARCH = {
    elements: {
        button: {
            start: document.getElementById("btn-start"),
            stop: document.getElementById("btn-stop")
        },
        select: {
            limit: document.getElementById("slc-limit"),
            interval: document.getElementById("slc-interval"),
            multitab: document.getElementById("slc-multitab"),
            device: document.getElementById("slc-device")
        },
        span: {
            progress: document.getElementById("span-progress"),
        },
        div: {
            settings: document.getElementById("div-settings"),
            timer: document.getElementById("div-timer"),
            bing: document.getElementById("div-bing")
        }
    },
    cookies: {
        set: (name, value, expires) => {
            try {
                let d = new Date();
                d.setTime(d.getTime() + (expires * 24 * 60 * 60 * 1000));
                let cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
                document.cookie = cookie;
            } catch (e) { }
        },
        get: (name) => {
            let value = null;
            try {
                let cookies = document.cookie.split(';');
                cookies.forEach((cookie) => {
                    if ((cookie + "=").trim().indexOf(name) == 0)
                        value = cookie.substring(name.length + 2, cookie.length);
                });
            } catch (e) { }
            return { name, value };
        },
        load: () => {
            let modal_help = new bootstrap.Modal(document.getElementById('modal-help'), {});
            let _need_help = BING_AUTOSEARCH.cookies.get("_need_help");
            let _multitab_mode = BING_AUTOSEARCH.cookies.get("_multitab_mode");
            let _search_interval = BING_AUTOSEARCH.cookies.get("_search_interval");
            let _search_limit = BING_AUTOSEARCH.cookies.get("_search_limit");
            if (!_need_help.value) {
                modal_help.show();
                BING_AUTOSEARCH.cookies.set("_need_help", BING_AUTOSEARCH.search.multitab.toString(), 365);
            }
            if (!_search_interval.value) {
                modal_help.show();
                BING_AUTOSEARCH.cookies.set("_search_interval", BING_AUTOSEARCH.search.interval.toString(), 365);
            } else {
                BING_AUTOSEARCH.elements.select.interval.value = BING_AUTOSEARCH.search.interval = parseInt(_search_interval.value.toString());
            }
            if (!_search_limit.value) {
                modal_help.show();
                BING_AUTOSEARCH.cookies.set("_search_limit", BING_AUTOSEARCH.search.limit.toString(), 365);
            } else {
                BING_AUTOSEARCH.elements.select.limit.value = BING_AUTOSEARCH.search.limit = parseInt(_search_limit.value.toString());
            }
            if (!_multitab_mode.value) {
                (function (a) {
                    if ((/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera mini|opera mobi|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)))
                        BING_AUTOSEARCH.elements.select.multitab.value = "true";
                })(navigator.userAgent || navigator.vendor || window.opera);
                BING_AUTOSEARCH.cookies.set("_multitab_mode", BING_AUTOSEARCH.elements.select.multitab.value, 365);
            } else {
                BING_AUTOSEARCH.elements.select.multitab.value = _multitab_mode.value;
                BING_AUTOSEARCH.search.multitab = (_multitab_mode.value === "true");
            }
        }
    },
    search: {
        limit: 35,
        interval: 10000,
        multitab: false,
        device: "desktop",
        engine: {
            terms: {
                lists: [
                    [
                        "أخبار اليوم",
                        "أسعار الدولار",
                        "وظائف خالية",
                        "نتيجة الثانوية العامة",
                        "مشاهير العرب",
                        "مباريات الأهلي",
                        "طقس القاهرة",
                        "مسلسلات رمضان",
                        "التعليم في مصر",
                        "سيارات جديدة",
                        "الذهب اليوم",
                        "كورونا",
                        "أحدث التكنولوجيا",
                        "السياحة في مصر",
                        "الرياضة المصرية",
                        "تريندات تويتر",
                        "تريندات فيسبوك",
                        "مهرجانات القاهرة",
                        "الجامعات المصرية",
                        "سعر البنزين",
                        "الاقتصاد المصري",
                        "إعلانات وظائف",
                        "حوادث اليوم",
                        "عروض سوبر ماركت",
                        "تخفيضات الصيف",
                        "البرامج التلفزيونية",
                        "مهرجان الجونة",
                        "الموسيقى العربية",
                        "فنانون مصريون",
                        "أخبار السياسة"
                    ]
                ],
                trends: [],
                async fetchEgyptTrends() {
                    try {
                        let response = await fetch('https://trends24.in/egypt/');
                        let html = await response.text();
                        let parser = new DOMParser();
                        let doc = parser.parseFromString(html, 'text/html');
                        let hashtags = Array.from(doc.querySelectorAll('.trend-card .trend-card__list li a')).map(a => a.textContent.trim());
                        if (hashtags.length > 0) {
                            this.trends = hashtags;
                        }
                    } catch (e) { this.trends = []; }
                },
                random: function () {
                    let list = this.trends && this.trends.length > 0 ? this.trends : this.lists[0];
                    let term = list[Math.floor(Math.random() * list.length)];
                    return term;
                }
            },
            form: {
                params: [
                    "QBLH", "QBRE", "HDRSC1", "LGWQS1", "LGWQS2", "LGWQS3", "R5FD", "R5FD1", "R5FD2", "R5FD3", "R5FD4", "R5FD5", "R5FD6", "R5FD7", "QSRE1", "QSRE2", "QSRE3", "QSRE4", "QSRE5", "QSRE6",
                    "QBLH", "QBRE", "HDRSC1", "LGWQS1", "LGWQS2", "LGWQS3", "R5FD", "R5FD1", "R5FD2", "R5FD3", "R5FD4", "R5FD5", "R5FD6", "R5FD7", "QSRE1", "QSRE2", "QSRE3", "QSRE4", "QSRE5", "QSRE6"
                ],
                random: () => {
                    return BING_AUTOSEARCH.search.engine.form.params[Math.floor(Math.random() * BING_AUTOSEARCH.search.engine.form.params.length)]
                }
            },
            window: {
                open: (search) => {
                    try {
                        let ua = BING_AUTOSEARCH.search.device === "mobile"
                            ? "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36 EdgA/139.0.0.0"
                            : navigator.userAgent;
                        let w = window.open(search.url);
                        if (w) {
                            try {
                                Object.defineProperty(w.navigator, 'userAgent', { get: function () { return ua; } });
                            } catch (e) { }
                            setTimeout(() => {
                                w.close();
                            }, (search.interval <= 10000 && BING_AUTOSEARCH.search.interval !== 9999 ? search.interval : 10000) - 500);
                        }
                    } catch (e) { }
                }
            },
            iframe: {
                add: (search) => {
                    let iframe = document.createElement("iframe");
                    iframe.setAttribute("src", search.url);
                    iframe.setAttribute("title", search.term);
                    iframe.setAttribute("data-index", search.index);
                    if (BING_AUTOSEARCH.elements.div.bing.firstChild)
                        BING_AUTOSEARCH.elements.div.bing.removeChild(BING_AUTOSEARCH.elements.div.bing.firstChild);
                    BING_AUTOSEARCH.elements.div.bing.appendChild(iframe);
                }
            },
            settings: {
                toString: () => {
                    try {
                        return `${BING_AUTOSEARCH.elements.select.limit.options[BING_AUTOSEARCH.elements.select.limit.selectedIndex].text}, ${BING_AUTOSEARCH.elements.select.interval.options[BING_AUTOSEARCH.elements.select.interval.selectedIndex].text}, ${BING_AUTOSEARCH.elements.select.multitab.options[BING_AUTOSEARCH.elements.select.multitab.selectedIndex].text}`;
                    } catch (e) {
                        return `Oops! There was an error loading the settings, please clear your browser cookies and reload the page to continue`;
                    }
                }
            },
            progress: {
                update: (search) => {
                    let progress = `(${search.index < 10 ? "0" + search.index : search.index}/${BING_AUTOSEARCH.search.limit < 10 ? "0" + BING_AUTOSEARCH.search.limit : BING_AUTOSEARCH.search.limit})`;
                    document.title = `${progress} - Bing Auto Search Running`;
                    BING_AUTOSEARCH.elements.span.progress.innerText = progress;
                }
            },
            timer: {
                next: null,
                complete: null,
                toClockFormat: (milliseconds, showHours = false) => {
                    let hrs = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
                    let min = Math.floor((milliseconds / 1000 / 60) % 60);
                    let sec = Math.floor((milliseconds / 1000) % 60);
                    return `${showHours ? String(hrs).padStart(2, '0') + ":" : ""}${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
                },
                updateEstimatedTime: (search) => {
                    let now = new Date();
                    let next = new Date(now.getTime() + BING_AUTOSEARCH.search.interval);
                    let complete = new Date(now.getTime() + (BING_AUTOSEARCH.search.interval * (BING_AUTOSEARCH.search.limit - search.index)));
                    if (search.index === BING_AUTOSEARCH.search.limit)
                        next = now;
                    BING_AUTOSEARCH.search.engine.timer.next = next;
                    BING_AUTOSEARCH.search.engine.timer.complete = complete;
                },
                run: () => {
                    let now = new Date();
                    let next = (BING_AUTOSEARCH.search.engine.timer.next - now);
                    let complete = (BING_AUTOSEARCH.search.engine.timer.complete - now);
                    if (BING_AUTOSEARCH.search.interval === 9999) {
                        BING_AUTOSEARCH.elements.div.timer.innerHTML = `<strong>Auto Search Running:</strong> 10~60 seconds (random) auto search interval active.`;
                    } else if (complete >= 0) {
                        BING_AUTOSEARCH.elements.div.timer.innerHTML = `<strong>Auto Search Running:</strong> ${next >= 0 ? `New auto search in ${BING_AUTOSEARCH.search.engine.timer.toClockFormat(next)}` : ""} | Estimated time left: ${BING_AUTOSEARCH.search.engine.timer.toClockFormat(complete, true)}`;
                        setTimeout(() => {
                            BING_AUTOSEARCH.search.engine.timer.run();
                        }, 1000);
                    } else {
                        BING_AUTOSEARCH.elements.div.timer.innerHTML = `<strong>Auto Search Running:</strong> Stopping the auto search process...`;
                    }
                }
            }
        },
        generate: () => {
            let searches = new Array();
            let randomDelay = 0;
            do {
                let term = BING_AUTOSEARCH.search.engine.terms.random();
                if (!searches.map(s => s.term).includes(term)) {
                    let index = searches.length + 1;
                    let url = `https://www.bing.com/search?q=${encodeURIComponent(term.toLowerCase())}&FORM=${BING_AUTOSEARCH.search.engine.form.random()}`;
                    let delay = BING_AUTOSEARCH.search.interval * searches.length;
                    if (BING_AUTOSEARCH.search.interval === 9999 && searches.length > 0)
                        delay = randomDelay = ((Math.floor(Math.random() * 51) + 10) * 1000) + randomDelay;
                    searches.push({ term, url, index, delay });
                }
            } while (searches.length < BING_AUTOSEARCH.search.limit)
            return searches;
        },
        start: async () => {
            await BING_AUTOSEARCH.search.engine.terms.fetchEgyptTrends();
            let searches = BING_AUTOSEARCH.search.generate();
            searches.forEach((search) => {
                setTimeout(() => {
                    BING_AUTOSEARCH.search.engine.progress.update(search);
                    BING_AUTOSEARCH.search.engine.timer.updateEstimatedTime(search);
                    if (search.index === BING_AUTOSEARCH.search.limit) {
                        setTimeout(() => {
                            BING_AUTOSEARCH.search.stop();
                        }, (search.interval <= 10000 && BING_AUTOSEARCH.search.interval !== 9999 ? search.interval : 10000));
                    }
                    if (search.delay === 0)
                        BING_AUTOSEARCH.search.engine.timer.run();
                    if (!BING_AUTOSEARCH.search.multitab)
                        BING_AUTOSEARCH.search.engine.iframe.add(search);
                    else
                        BING_AUTOSEARCH.search.engine.window.open(search);
                }, search.delay);
            });
        },
        stop: () => {
            window.open("https://rewards.bing.com/pointsbreakdown");
            location.reload();
        }
    },
    load: () => {
        BING_AUTOSEARCH.cookies.load();
        BING_AUTOSEARCH.elements.button.start.addEventListener("click", () => {
            BING_AUTOSEARCH.elements.button.start.style.display = "none";
            BING_AUTOSEARCH.elements.button.stop.style.display = "inline-block";
            BING_AUTOSEARCH.search.device = BING_AUTOSEARCH.elements.select.device.value;
            BING_AUTOSEARCH.search.start();
        });
        BING_AUTOSEARCH.elements.button.stop.addEventListener("click", () => {
            BING_AUTOSEARCH.search.stop();
        });
        BING_AUTOSEARCH.elements.select.multitab.addEventListener("change", () => {
            BING_AUTOSEARCH.cookies.set("_multitab_mode", BING_AUTOSEARCH.elements.select.multitab.value, 365);
            location.reload();
        });
        BING_AUTOSEARCH.elements.select.limit.addEventListener("change", () => {
            BING_AUTOSEARCH.cookies.set("_search_limit", BING_AUTOSEARCH.elements.select.limit.value, 365);
            location.reload();
        });
        BING_AUTOSEARCH.elements.select.interval.addEventListener("change", () => {
            BING_AUTOSEARCH.cookies.set("_search_interval", BING_AUTOSEARCH.elements.select.interval.value, 365);
            location.reload();
        });
        BING_AUTOSEARCH.elements.select.device.addEventListener("change", () => {
            BING_AUTOSEARCH.search.device = BING_AUTOSEARCH.elements.select.device.value;
        });
        BING_AUTOSEARCH.elements.div.settings.innerHTML = `<strong>Auto Search Settings:</strong> ${BING_AUTOSEARCH.search.engine.settings.toString()}.`;
    }
};

window.addEventListener("load", () => {
    BING_AUTOSEARCH.load();
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-YXNCPPFVCW');
});