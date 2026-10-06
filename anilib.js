(function () {
    'use strict';

    function AniLibTizenPlugin() {
        var base_domain = 'https://animelib.org';
        var api_url = 'https://animelib.orgapi/v1/anime/updates?limit=15';

        this.start = function () {
            this.addMenu();
        };

        this.addMenu = function () {
            var menu_item = $('<li class="menu__item selector" data-action="anilib_cat"><span class="menu__text">AniLib Каталог</span></li>');
            menu_item.on('hover:enter', function () {
                Lampa.Activity.push({
                    label: 'AniLib Аниме',
                    component: 'anilib_tizen_view'
                });
            });
            $('.menu__list').append(menu_item);
        };

        Lampa.Component.add('anilib_tizen_view', function (object, activity) {
            var comp = this;
            var html, items;

            this.create = function () {
                html = $('<div class="directory"><div class="directory__titles"><span class="directory__title active" style="font-weight: bold;">Последние обновления аниме</span></div><div class="directory__body"><div class="directory__list scroll-box"></div></div></div>');
                items = html.find('.directory__list');
                return html;
            };

            this.start = function () {
                this.loadUpdates();
            };

            this.render = function () { return html; };
            this.destroy = function () { html.remove(); };

            this.loadUpdates = function() {
                items.empty();
                items.append('<div class="empty" style="padding: 20px;">Загрузка релизов AniLib...</div>');

                // Нативный метод Lampa для Tizen, обходящий защиту сайтов
                var network = new Lampa.Reguest();
                network.silent(api_url, function (res) {
                    items.empty();
                    var data = typeof res === 'string' ? JSON.parse(res) : res;
                    var list = data.data || data;

                    if (list && list.length > 0) {
                        comp.buildCards(list);
                    } else {
                        items.append('<div class="empty" style="padding: 20px;">Релизы не найдены.</div>');
                    }
                }, function () {
                    items.empty();
                    items.append('<div class="empty" style="padding: 20px;">Ошибка сети. Проверьте адрес зеркала.</div>');
                });
            };

            this.buildCards = function(list) {
                list.forEach(function (anime) {
                    var title = anime.title || anime.name || 'Без названия';
                    var poster = anime.poster || '';
                    if (poster && !poster.startsWith('http')) {
                        poster = base_domain + poster;
                    } else if (!poster) {
                        poster = 'https://lampa.mx';
                    }
                    
                    var card = $('<div class="card selector" style="display: inline-block; margin: 15px; width: 160px; cursor: pointer; text-align: center;"><img src="'+poster+'" class="card__img" style="width: 100%; height: 230px; object-fit: cover; border-radius: 8px;"><div class="card__title" style="margin-top: 8px; font-size: 14px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">'+title+'</div></div>');
                    
                    card.on('hover:enter', function () {
                        comp.openPlayerMenu(anime);
                    });
                    items.append(card);
                });

                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(false, html);
                    },
                    left: function () { Lampa.Controller.toggle('menu'); }
                });
                Lampa.Controller.toggle('content');
            };

            this.openPlayerMenu = function(anime) {
                var target_title = anime.title || anime.name;
                Lampa.Select.show({
                    title: target_title,
                    items: [
                        { title: 'Серия 1 — 1080p (Чистый поток)', url: 'https://unified-streaming.com', quality: '1080p' }
                    ],
                    onSelect: function (item) {
                        var video_stream = {
                            title: target_title + ' (' + item.title + ')',
                            url: item.url,
                            quality: item.quality
                        };
                        Lampa.Player.play(video_stream);
                        Lampa.Player.playlist([video_stream]);
                    }
                });
            };
        });
    }

    if (window.appready) new AniLibTizenPlugin().start();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') new AniLibTizenPlugin().start(); });
})();
