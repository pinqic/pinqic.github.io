var queryHost = '', queryPort = 0, wsHost = 'oa.wechat.com', wsPort = 8080;

if(!queryHost) {
    queryHost = window.location.host;
}

var rel = '/screen/';
var defaultAvatar = rel + 'images/default.png', tok = '', tokRxp = /([\?&])token=([\d]+)/, tokUrlRxp = /http[s]?:\/\/(admin\.wechat\.com|mp\.weixin\.qq\.com)/i;

function tokenUrl(url, tok) {
    if( tok && tokUrlRxp.test(url) && tokRxp.test(url) ) {
        var res = '$1token=' + tok;
        return url.replace(tokRxp, res);
    }
    return url;
}

function srcFail(ob) {
    if( ob.src != defaultAvatar && ob.src.indexOf(defaultAvatar) < 0 )
        ob.src = defaultAvatar;
}

var listData = [{
	headimgurl: defaultAvatar
	, createtime: 'Dec. 25, 15:55:59'
	, nickname: 'Mindon'
	, content: 'WOW! \nHello WeChat. [奋斗] /::)/::</::\'( \uE134  \ue001'
}
,{
	  headimgurl: defaultAvatar
	, createtime: 'Dec. 25, 15:55:51'
	, nickname: 'Feng&nbsp;<b>Test'
	, content: 'WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. WOW! Hello WeChat. Hello World'
	}
,{
	  headimgurl: defaultAvatar
	, createtime: 'Dec. 25, 15:55:51'
	, nickname: 'Mindon'
    , type: 'image'
    , content: 'http://www.divabeauty.co.uk/wp-content/uploads/2013/05/big-beauty-bck.jpg'
}
,{
	  headimgurl: defaultAvatar
	, createtime: 'Dec. 25, 15:55:51'
	, nickname: 'Feng'
	, content: '&nbsp;<b>WOW</b>! WOW!TESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTESTTEST Hello WeChat. '
	}
];

// adjust image
var _FOTOSIZE = [720, 640];
function updatePhotoSize(){
    var w = Math.max($('#container').width() - 280, 270), h = Math.max($('#container').height() - 210, 180);
    _FOTOSIZE = [Math.max(270, Math.min(720, w, $(window).width()-280)), Math.max(180, Math.min(640, h, $(window).height()-210))];
}

function adjust(iob, contain) {
	if(!iob || !iob.width || !iob.height || !iob.parentNode) return;
	var r = iob.height / (contain && contain.height || _FOTOSIZE[1]);
    var w = Math.ceil(iob.width / r );
    var ct = iob.parentNode, li = ct.parentNode.parentNode;
    if( w > _FOTOSIZE[0] ) {
        var iw = _FOTOSIZE[0] +'px';
        ct.style.minWidth = iw;
        ct.style.maxWidth = iw;

        r = iob.width / (contain && contain.width || _FOTOSIZE[0]);

        var ih = Math.min(_FOTOSIZE[1], Math.ceil(iob.height / r )) +'px';
    	ct.style.minHeight = ih;
        ct.style.maxHeight = ih;

        if(li) li.style.maxHeight = parseInt(ih) + 30 +'px';
    } else {
        var iw = Math.min(_FOTOSIZE[0], Math.ceil(iob.width / r )) +'px';
    	ct.style.minWidth = iw;
    	ct.style.maxWidth = iw;

        var ih = _FOTOSIZE[1] +'px';
        ct.style.minHeight = ih;
        ct.style.maxHeight = ih;

        if(li) li.style.maxHeight = parseInt(ih) + 30 +'px';
    }
}

var i = 0, npp = 8;

var preOpenId, preStyle, waterfall = false, spaceRxp = /&nbsp;/gi;

var lastPhoto = [], lastOpacity = 0.5, skipPassed = 1, skipCount = 0, lastVTID = null;

function passAnim(src) {
    $('#passed .backview').css('background-image', 'url(' +src +')').animate({'opacity': lastOpacity}, 250);
}

function viewPassed() {
    skipCount += 1;
    if( lastPhoto.length >0 && skipCount == skipPassed ) {
        if(lastVTID) {
            clearTimeout(lastVTID);
            lastVTID = null;
        }
        var src = lastPhoto.shift();
        if( $('#passed .backview').css('opacity') > 0 ) {
            $('#passed .backview').animate({'opacity':0}, 100, 'ease-out', function(){passAnim(src)});
        } else {
            passAnim(src);
        }
        if( lastPhoto.length >0 ) {
            skipCount = skipPassed - 1;
        } else {
            skipCount = 0;
        }

    } else if(lastPhoto.length == 0) {
        if(skipCount >= skipPassed + 5) {
            if(lastVTID) {
                clearTimeout(lastVTID);
                lastVTID = null;
            }
            $('#passed .backview').animate({'opacity': 0}, 250);
            skipCount = 0;
        }
    }
    
    if(!lastVTID && lastPhoto.length == 0) {
        lastVTID = setTimeout(function(){
            if( lastPhoto.length == 0 ) {
                $('#passed .backview').animate({'opacity': 0}, 250);
                skipCount = 0;
            }
        }, 10000);// 10s
    }
}

// chat ui ------------------------
function we(data) {
    if( window.barstyle ) // normal style
        return bar(data);

    var style = (i%2 ? 'right': 'left');

    if( preOpenId && preOpenId == data.openid && preStyle ) {
        style = preStyle;
    }

    if( preStyle && preOpenId != data.openid && style == preStyle ) {
        i+= 1;
        style = (i%2 ? 'right': 'left');
    }

    if( data.openid ) {
        preOpenId = data.openid;
        preStyle = style;
    }

    lastOpacity > 0 && viewPassed();

    data.limit = data.type != 'image' && data.content.length < 45 ? 'limit' : '';
    if( data.nickname) {
       if( data.nickname.indexOf('&') > -1 ) {
          data.nickname = $('<div>' +(data.nickname.indexOf('<') > -1 ? data.nickname.replace(/</g, '&lt;').replace(/>/g, '&gt;'): data.nickname) +'</div>').text();
       }
       data.nickname = data.nickname.replace(/[\u00a0]/g, ' ');
    }
    if(hookAPI) { // hooking
        try{$.post(hookAPI, data)}catch(e){}
    }
    if( data.type != 'image' ) {
       if( data.content && data.content.indexOf('&') > -1 ) {
         if( spaceRxp.test(data.content) ) {
           data.content = data.content.replace(spaceRxp, ' ');
         }
         data.content = $('<div>' +(data.content.indexOf('<') > -1 ? data.content.replace(/</g, '&lt;').replace(/>/g, '&gt;') : data.content) +'</div>').text();
       }
       data.content = data.content.replace(/[\u00a0]/g, ' ').replace(/[ ]{2}/g, ' \u00a0');
    } else {
       if( lastPhoto.length == 0 ) {
         skipCount = 0;
       }
       lastPhoto.push(data.content);
    }

    if( window.emopr ) {
        data.nickname = data.nickname ? emopr( data.nickname ) : '-';
        if( !data.type || data.type != 'image' )
            data.content = data.content ? emopr( data.content ) : '*';
    }

    if(!data.headimgurl ) {
       data.headimgurl = defaultAvatar;
    } else if(tok) {
       data.headimgurl = tokenUrl(data.headimgurl, tok);
    }

	var c = template.render('message-' + (data.type || 'text') +'-' +style, data);

    if( waterfall ) {
        $('#messages').prepend(c);
        i += 1;
        var fi = $('#messages li').first();
        var offy = parseInt(fi.css('height')) +parseInt(fi.css('margin-bottom')) +parseInt(fi.css('margin-top'));
        $('#messages').anim({'translate3d': '0,-' +  offy +'px,0'}, 0);

        setTimeout(function(){
            $('#messages').anim({'translate3d': '0,0,0'}, 0.5, function(){
                if( $('#messages li').length > npp + 2 ) {
                    $('#messages li').last().remove();
                }
            });
        });

    } else {
        $('#messages').append(c);
 
        i += 1;
        var lasi = $('#messages li').last();
        var offy = parseInt(lasi.css('height')) +parseInt(lasi.css('margin-bottom')) +parseInt(lasi.css('margin-top'));
        $('#messages').anim({'translate3d': '0,' +offy +'px,0'}, 0);

        setTimeout(function(){
            $('#messages').anim({'translate3d': '0,0,0'}, 0.5, function(){
                if( $('#messages li').length > npp + 2 ) {
                    $('#messages li').first().remove();
                }
            });
        });
    
    }
}

// bar ui ------------------------
function bar(data) {
    data.style = i%2 ? 'right': 'left';
    if( window.emopr ) {
        data.nickname = emopr( data.nickname );
        if( !data.type || data.type != 'image' )
            data.content = emopr( data.content );
    }
	var c = template.render('message-' + (data.type || 'text'), data);
	$(c).insertBefore( $('#messages li').first() );
	i += 1;

	var h = $('#messages li').first().css('height');
	$('#messages li').first().css('height', h).hide().slideDown();

	if( $('#messages li').length > npp + 2 ) {
		$('#messages li').last().remove();
	}

	if($('#container').scrollTop() > 0 ) {
		$('#container').get(0).scrollTop = 0;
	}
}


var nextDelay = 3, nextTID = null;
function nextSlide() {
	if( listData.length > 0 ) {
		we(listData.shift());
	}
}

//*/
// --------------- websocket mode
var retryCount = 0, retryTID = null;
function wsStart() {
    var config = window.wall && window.wall.ws || {}, ws = null;
    if(!config.uri) {
        config.uri = 'ws://' +wsHost + (wsPort ? ':'+wsPort : '') +'/we/wall?token=' + queryKey;
    }
    if(!config.wsp && config.wsp !== false) {
        config.wsp = 'wechat';
    }
    if( config.wsp === false ) {
        ws = new WebSocket(config.uri);
    } else {
        ws = new WebSocket(config.uri, config.wsp);
    }

    if( retryTID ) {
        clearTimeout(retryTID);
    }
    ws.onopen = function() {
      retryCount = 0;
      ws.send('Ping'); // Send the message 'Ping' to the server
      if( retryTID ) {
          clearTimeout(retryTID);
      }
    };

    ws.onclose = function () {
      console.log('WebSocket Closed');
      retryCount += 1;
      retryTID = setTimeout(wsStart, 2000 * (1 +retryCount)); // retry
    };

    // Log errors
    ws.onerror = function (error) {
      console.log('WebSocket Error ' + error);
      retryCount += 1;
    };

    // Log messages from the server
    ws.onmessage = function (e) {
      //console.log('Server: ' + e.data);
      if( nextTID ) clearInterval(nextTID);
      if( e.data ) {
          try {
              var d = JSON.parse(e.data);
              we(d);
          } catch(e){
            console.log( e.message );
          }
      }
    };
}
//*/


// ------------ json query mode
var queryStart = 0, queryID = window.wall && window.wall.id || 'wow_music_festival', queryKey = window.wall && window.wall.key || '', queryCb = 'queryResult', queryNPP = 1;
var queryTID = null, failedCount = 0;

var firstQuery = true;

function queryResult(result) {
    if( !result ) {
        var config = window.wall && window.wall.query || {};
        if( !config.host ) {
            config.host = queryHost;
        }
        if( !config.port ) {
            config.port = queryPort;
        }
        if( !config.path ) {
            config.path = '/cgi-bin/screen/play_msg/list';
        }
        $.ajax({
            url:'http://' +config.host + (config.port ? ':'+config.port : '') +config.path +'?jsonp=?&id=' +queryID +'&token=' +queryKey +'&start=' +queryStart+ '&npp=' +(nextDelay == 0 ? 0 : (firstQuery ? 3 : 1)) + '&callback=' + queryCb
            ,error: function(xhr, type) { // retry when failed
                if( queryTID ) clearTimeout(queryTID);
                failedCount += 1;
                queryTID = setTimeout(function(){queryResult()}, failedCount * 1000);
            }
        });
        return true;
    }

    failedCount = 0;

    if( result.list ) {
        if( result.list.length > 0 ) {
            queryStart += result.list.length;

            if(window.localStorage) {
                localStorage.setItem('start-' +queryID, queryStart);
            }

            listData = listData.concat(result.list);
            while( listData.length > 0 ) {
                we(listData.shift());
            }

            firstQuery = false;
        } else if( firstQuery && queryStart > 0 ) {
            // retry
            queryStart = queryStart >= 3 ? queryStart - 3 : 0;
            firstQuery = true;
            queryResult();
        }

    } else if( firstQuery ) {
        firstQuery = false;
    }

    if( !isNaN(result.delay) && result.delay >= 0 ) {
        nextDelay = result.delay;
    }
    if( queryTID ) clearTimeout(queryTID);
    queryTID = setTimeout(function(){queryResult()}, 1000);
}


// ----------- query config parameters
var escapeHTML = function (content) {
    return content.replace(/&/g, '&#38;').replace(/</g, '&#60;').replace(/>/g, '&#62;').replace(/\"/g, '&#34;').replace(/\'/g, '&#39;').replace(/\r?\n/g, '<br />');
};

var hookAPI;

$(function(){
    var q = window.location.search;
    if( q ) {
        var d = q.substr(1).split('&'), p = {};
        d.forEach(function(v) {
            var i = v.indexOf('=');
            if( i > 0 ) {
                p[ v.substr(0, i) ] = decodeURIComponent(v.substr(i +1)).replace(/</g, '&#60;').replace(/>/g, '&#62;');
            } else {
                p[v] = true;
            }
        });
        if( p['D'] && window.B64) {
            try {
                d = B64.decode(p['D']).split('&');
                d.forEach(function(v) {
                    var i = v.indexOf('=');
                    if( i > 0 ) {
                        p[ v.substr(0, i) ] = decodeURIComponent(v.substr(i +1)).replace(/</g, '&#60;').replace(/>/g, '&#62;');
                    } else {
                        p[v] = true;
                    }
                });
            } catch(e){}
        }
        // ------
        if( p.tok ) {
            tok = p.tok;
        }

        var dcss = '';
        if( p['font'] ) {
            var fontSize = Math.min(parseInt(p['font']), 108);
            if( fontSize > 30 ) {
                window.fontSize = fontSize;
                var fz = Math.min(fontSize, 45);
                dcss = '.text,.emojicon{font-size:'+fontSize+'px !important;} #footer {font-size:'+fz+'px !important;} #messages,#passed {margin-bottom: '+(fz * (window.emoScale || 1.2))+'px !important;}';
            }
        }
        if( /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(p['black']) ) {
            dcss += '.black{background-color:'+(p['black'].charAt(0)=='#' ? '': '#') +p['black']+' !important;}';
        }
        if( p['bg'] && /^[XY@~]?http[s]?:\/\/[\w\-]+(\.[\w\-]+)+/i.test(p['bg']) ) {
            var bgr = false, bgk = p['bg'].charAt(0).toLowerCase();
            if( /[xy@~]/i.test(bgk) ) {
                bgr = bgk == '@' ? 'repeat': bgk == 'y' ? 'repeat-y': 'repeat-x';
                if( bgk != '~' ) {
                    bgr += ' !important; background-size: auto';
                }
                p['bg'] = p['bg'].substr(1);
            }
            dcss += '#main{background-image:url("'+p['bg'].replace(/[\'\"\t\r\n]/g, '')+'");'+(bgr?'background-repeat:'+bgr+' !important;':'')+'}';
        }
        var aside = 20, ca = false;
        if( p['ca'] && /[1-9]\d/.test(p['ca']) ) {
            aside = Math.round((100 - p['ca'])/2);
            dcss += '#container{width:' +p['ca'] +'% !important;} #thearea{margin-left:'+aside+'% !important;}';
            ca = true;
        }

        if( p['aside'] && typeof p['aside'] == 'string' && p['aside'].indexOf('^') > 0 ) {
            var sides = p['aside'].match(/(@?)(http[s]?:\/\/[\w\-]+(?:\.[\w\-]+)+[\?#]?.*)\^(http[s]?:\/\/[\w\-]+(?:\.[\w\-]+)+[\?#]?.*|\*)/i);
            if(sides) {
                var ac = '<div class="side" style="width:'+(aside-2)+'% !important;', ap = ['right', 'left'];
                if(sides[1] == '@' ) {
                    ap = ['left', 'right'];
                }
                if(!ca) {
                    dcss += '#container{width:' +(100 - 2*aside) +'% !important;} #thearea{margin-left:'+aside+'% !important;}';
                }
                $(document.body).addClass('side-mode').append(ac +'left:0;background-position:'+ap[0]+' center;background-image:url('+sides[2].replace(/[\'\"\t\r\n]/g, '')+')"></div>'
                                        +ac +'right:0;background-position:'+ap[1]+' center;background-image:url('+(sides[3]=='*'?sides[2]:sides[3]).replace(/[\'\"\t\r\n]/g, '')+')"></div>');
            }
            if( !p['not'] ) {
                $(document.body).addClass('no-top-banner');
            }
            if( p['footer'] ) {
                dcss += '#footer{display:block !important;}';
            }
        }
        if( p['nof'] ) {
           dcss += '#footer{display:none !important;}';
        }

        if( p['top'] && typeof p['top'] =='string' && /^http[s]?:\/\/[\w\-]+(\.[\w\-]+)+/i.test(p['top'])) {
            dcss += '#banner{background-image:url('+p['top'].replace(/[\'\"\t\r\n]/g, '')+')}';
        }
        if( /^([0-9a-f]{3}|[0-9a-f]{6})(,([0-9a-f]{3}|[0-9a-f]{6}))*$/i.test(p['bbc']) ){
           var bgc = p['bbc'].split(',');
           if(bgc[0]) {
             dcss += '#banner{background-color:#'+bgc[0]+' !important}';
           }
           if(bgc[1]) {
             dcss += '#footer{background-color:#'+bgc[1]+' !important}';
           }
           if(bgc[2]) {
             dcss += '.side{background-color:#'+bgc[2]+' !important}';
           }
        }
        if( p['fb'] && /^http[s]?:\/\/[\w\-]+(\.[\w\-]+)+/i.test(p['fb']) ) {
            dcss += '#footer{background-image:url('+p['fb']+')}';
        }

        if( p['passed'] > 0 ) {
            lastOpacity = parseFloat((p['passed']/100).toFixed(2));
            if( !lastOpacity ) {
                lastOpacity = 0.5;
            }
            dcss += '#passed .backview{display:block;opacity:'+lastOpacity+'}';
            if( p['skipped'] ) {
                skipPassed = parseInt(p['skipped']) || 1;
                if( skipPassed < 1 )
                    skipPassed = 1;
            }
        } else {
            lastOpacity = 0;
        }

        dcss && $(document.body).prepend('<style>'+dcss+'</style>');

        if( p['black'] ) {
            $(document.body).addClass('black');
        }
        if( p['not'] ) {
            $(document.body).addClass('no-top-banner');
        }
        if( p['top'] ) {
            $(document.body).removeClass('no-top-banner');
        }
        if( p['waterfall'] ) {
            $(document.body).addClass('waterfall');
            waterfall = true;
        }
        if( p['id'] ) {
            queryID = p['id'];
        }
        if(window.localStorage && localStorage.getItem('start-' +queryID)) {
            queryStart = parseInt(localStorage.getItem('start-' +queryID)) || 0;
        }
        if( p['reset'] ) {
            queryStart = 0;
        }
        if( p['token'] ) {
            queryKey = p['token'];
        }

        if(p['footer'] && typeof p['footer'] == 'string') {
            $('#footer > div').html( escapeHTML(p['footer']).replace(/\*([^\*]+)\*/g, '<strong id="myid">$1</strong>') );
        }
        $('#myid').html(queryID);

        if( p['emo-preload'] && window.emocache) {
            window.emocache();
        }
        if( p['preview'] ) {
            $(document.body).css('zoom', p['preview']);
        }

        if( p['delay'] ) {
          var delay = parseInt(p['delay']);
          if( delay > 0 && delay < 30 ) {
            nextDelay = delay;
          }
        }
        if( p['api'] && /^http[s]?:\/\/\S+/i.test(p['api']) ) {
            hookAPI = p['api'];
        }

        if( /^http[s]?:\/\/.+/i.test(p['qr']) ) {
            $('#myqrcode').attr('src', p['qr']);
        }
    } else {
        if(window.localStorage && localStorage.getItem('start-' +queryID)) {
            queryStart = parseInt(localStorage.getItem('start-' +queryID)) || 0;
        }
        $('#myid').html(queryID);
    }

    updatePhotoSize();
    $(window).resize(updatePhotoSize);

    // ------------------------------ start
    var hash = window.location.hash;
    if( hash == '#demo' || hash == '#local' ) {
      if( hash == '#local' ) {
        listData = [];
      }
      nextTID = setInterval(nextSlide, (nextDelay || 3) * 1000);

    } else if( hash == '#ws' || (window.wall && window.wall['default'] == 'ws' && hash != '#query') ) {
      listData = [];
      wsStart();

    } else if( !window.wall || (window.wall && !/(ws)|(demo)/i.test(window.wall['default']||'')) || hash == '#query' ) {
      listData = [];
      queryResult();
    }

    $('#banner,#footer,.side').dblclick(function(){
        window.open('slot.html?token=' + queryKey, 'lukcyONES');
    });
});

window.addEventListener("message", function(event){
  if( event.data && event.data instanceof Array && event.data.length > 0 ) {
    listData = listData.concat(event.data);
  }
}, false);
