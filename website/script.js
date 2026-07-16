document.addEventListener('DOMContentLoaded', function() {
            var translations = {
                ar: {
                    downloadNow: "حمل الآن",
                    forPhone: "للهاتف",
                    forTv: "للتلفاز",
                    tvDownloadInfo: 'يمكنك تحميله على التلفاز باستخدام الكود <span class="badge" dir="ltr">9290513</span> في تطبيق Downloader.',
                    requiresPlayer: "يتطلب تطبيق Just Player",
                    playerDownloadInfo: 'حمل <a href="https://github.com/moneytoo/Player" target="_blank" class="text-link">Just Player</a> من <a href="https://play.google.com/store/apps/details?id=com.brouken.player&hl=ar" target="_blank" class="text-link">متجر التطبيقات</a> أو باستخدام كود Downloader : <span class="badge" dir="ltr">2747416</span>',
                    featuresTitle: "المميزات:",
                    feat1: "قنوات بث مباشر",
                    feat2: "أفلام ومسلسلات مدبلجة ومترجمة مختارة بعناية",
                    feat3: "مفتوح المصدر",
                    feat4: "بدون إعلانات",
                    feat5: "موجه للأطفال بشكل شبه كامل",
                    viewSource: "عرض كود المصدر",
                    tvScreenText: "ZiroTube TV",
                    btnLabel: "English"
                },
                en: {
                    downloadNow: "Download Now",
                    forPhone: "For Phone",
                    forTv: "For TV",
                    tvDownloadInfo: 'You can download it to your TV using code <span class="badge" dir="ltr">9290513</span> on the TV\'s Downloader app.',
                    requiresPlayer: "Requires Just Player",
                    playerDownloadInfo: 'Download <a href="https://github.com/moneytoo/Player" target="_blank" class="text-link">Just Player</a> from the <a href="https://play.google.com/store/apps/details?id=com.brouken.player&hl=en" target="_blank" class="text-link">app store</a> or using Downloader code: <span class="badge" dir="ltr">2747416</span>',
                    featuresTitle: "Features:",
                    feat1: "Live TV channels",
                    feat2: "Carefully selected dubbed and subtitled movies and series",
                    feat3: "Open source",
                    feat4: "No ads",
                    feat5: "Almost entirely geared towards children",
                    viewSource: "View Source Code",
                    tvScreenText: "ZiroTube TV",
                    btnLabel: "العربية"
                }
            };
            var currentLang = 'ar';
            var langBtn = document.getElementById('lang-switch');
            langBtn.addEventListener('click', function() {
                currentLang = currentLang === 'ar' ? 'en' : 'ar';
                document.documentElement.lang = currentLang;
                document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
                document.querySelectorAll('[data-i18n]').forEach(function(el) {
                    var key = el.getAttribute('data-i18n');
                    if (translations[currentLang][key]) {
                        el.innerHTML = translations[currentLang][key];
                    }
                });
                langBtn.textContent = translations[currentLang].btnLabel;
            });
            var mockupContainer = document.getElementById('mockup-container');
            var rafId = null;
            document.addEventListener('mousemove', function(e) {
                if (window.innerWidth < 900) return;
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(function() {
                    var isRtl = document.documentElement.dir === 'rtl';
                    var xAxis = ((window.innerWidth / 2 - e.pageX) / 50) * (isRtl ? -1 : 1);
                    var yAxis = (window.innerHeight / 2 - e.pageY) / 50;
                    mockupContainer.style.transform = 'rotateY(' + xAxis + 'deg) rotateX(' + yAxis + 'deg)';
                });
            });
            document.addEventListener('mouseleave', function() {
                if (rafId) cancelAnimationFrame(rafId);
                mockupContainer.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                mockupContainer.style.transform = 'rotateY(0deg) rotateX(0deg)';
            });
            document.addEventListener('mouseenter', function() {
                mockupContainer.style.transition = 'transform 0.1s linear';
            });
        });