// ==UserScript==
// @name         TagPro Groups on Homepage
// @version      1.0
// @description  Show available groups *of all servers* on the homepage, joiner page and inside a group
// @author       Ko
// @supportURL   https://www.reddit.com/message/compose/?to=Wilcooo
// @website      https://redd.it/no-post-yet
// @download     https://raw.githubusercontent.com/wilcooo/TagPro-GroupsOnHomepage/master/tpgoh.user.js
// @match        http://*.koalabeast.com:*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.0/socket.io.slim.js
// @connect      script.google.com
// @connect      script.googleusercontent.com
// ==/UserScript==

////////////////////////////////////////////////////////////////////////////////////////////
//     ### --- OPTIONS --- ###                                                            //
////////////////////////////////////////////////////////////////////////////////////////  //
                                                                                      //  //
// Shows available groups *of all servers* on the homepage, and lets you create a new //  //
// group with a single click from there too. This also works when you've already      //  //
// joined a group!                                                                    //  //
const groups_on_home = true;                                                          //  //
                                                                                      //  //
// Shows available groups *of all servers* while finding/joining a game, and lets you //  //
// create a new group with a single click from there too. Works when already in one!  //  //
const groups_on_find = true;                                                          //  //
                                                                                      //  //
// Shows available groups *of all servers* on the 'groups' page                       //  //
const groups_on_groups = true;                                                        //  //
                                                                                      //  //
// Shows available groups *of all servers* within a group you've already joined       //  //
const groups_in_group = true;                                                         //  //
                                                                                      //  //
// Position on homepage ( can be 'top', 'home', or 'bottom' )                         //  //
// 'home' means beneath the video on the homepage                                     //  //
// TODO: link to a picture that explains these positions                              //  //
const position = 'top';                                                               //  //
                                                                                      //  //
////////////////////////////////////////////////////////////////////////////////////////  //
//                                                     ### --- END OF OPTIONS --- ###     //
////////////////////////////////////////////////////////////////////////////////////////////





//////////////////////////////////////
// SCROLL FURTHER AT YOUR OWN RISK! //
//////////////////////////////////////




// Userscripts load in the order that they appear in Tamermonkey.
// Set this option to true if you want this script to be inserted to
// the page above than previously load scripts, instead of below.
const insertBefore = false;


const servers = ['centra','pi','chord','diameter','origin','sphere','radius','orbit'];

const groups_api = 'https://script.google.com/macros/s/AKfycbxF5kcVoFbqmLlbHB2_nJ_dCRoh2iOXDpFyzAq0Kw2UDjM7qEHf/exec';





if (window.location.pathname === '/groups') {  // If we are on the groups selection page

    if (groups_on_groups) show_groups( document.getElementById('groups-list'), false);
}

else if (window.location.pathname.match(/^\/groups\/[a-z]{8}$/)) {  // If we are in a group

    if (groups_in_group) show_groups();
}

else if (window.location.pathname === '/games/find') {  // In the process of joining a game

    if (groups_on_find) show_groups();
}

else if (window.location.port.match(/^8[0-9]{3}$/)) {  // If we are in a game
}

else if (window.location.pathname === '/') {  // If we are on the homepage

    if (groups_on_home) show_groups();
}

else {  // If we are on any other page of the server
}





function show_groups(groups_list=document.createElement('div'), newGroupWidget=true) {

    // Create a container for the groups
    if (!groups_list.parentElement) {
        var container = document.createElement('div');
        container.id = 'GroPro-groups';
        container.className = 'container';

        container.appendChild(groups_list);

        // Add the container to the userscript-div and make unhide that
        var pos = document.getElementById('userscript-'+position);
        if (insertBefore) pos.insertBefore(container, pos.firstChild);
        else              pos.append(container);
        pos.classList.remove('hidden');
    }

    groups_list.className = 'row groups-list';

    var groups_list_cache = GM_getValue('groups-list-cache',{});

    groups_list.innerHTML = '<div class=spinner align=center> <div class=spinner-item></div> <div class=spinner-item></div> <div class=spinner-item></div> <div class=spinner-item></div>';

    if (Date.now() - groups_list_cache.time < 65e3) groups_list.innerHTML += groups_list_cache.html;



    // Get ping and server stats for each server
    var stats = new Promise(function(resolve, reject) {

        window.addEventListener('load',function(){
            var stats = {};

            var todo = servers.length;

            servers.forEach( function(server) {
                var host = 'http://tagpro-'+server+'.koalabeast.com:80';

                var connection = io.connect(host, {transports: ["websocket"]});

                connection.on('connect',function(){
                    var ping = -Date.now();
                    connection.emit('stats',{},function(response) {
                        ping += Date.now();
                        stats[server] = response;
                        stats[server].ping = ping;
                        if (--todo <= 0) resolve(stats);
                    });
                });
            });
        });
    });

    stats.then(console.log);

    var request = new XMLHttpRequest();

    request.onload = function() {
        var data = JSON.parse(request.response);

        groups_list.innerHTML = '';

        for (var group of data.groups) {
            var group_html =
                    `<div class="col-sm-6 col-md-4">
                        <div class="group-item">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="pull-right group-type"> `+group.type+` </div>
                                    <div class="group-name"> `+group.name+` </div>
                                </div>
                                <div class="col-xs-6">
                                    <div> Leader: `+group.leader+` </div>
                                    <div> Players: `+group.players+` </div>
                                </div>
                                <div class="col-xs-6">
                                    <a class="btn btn-primary pull-right" href="`+group.link+`"> Join Group </a>
                                </div>
                                <div class="col-xs-12">
                                    Server: `+group.server[0].toUpperCase() + group.server.slice(1)+`
                                    <i style="color:#868686" class="`+group.server+`-stats">
                                        <div class=spinner>
                                            <div class=spinner-item></div>
                                            <div class=spinner-item></div>
                                            <div class=spinner-item></div>
                                        </div>
                                    </i>
                                </div>
                            </div>
                        </div>
                    </div>`;
            groups_list.innerHTML += group_html;
        }

        stats.then(function(stats) {

            for (var server of servers) {
                for (var server_ping of document.getElementsByClassName(server+'-stats')) {
                    server_ping.innerText = '(ping: ' + stats[server].ping + ', ' + stats[server].players + ' players in ' + stats[server].games + ' games)';
                }
            }
        });

        if (data.groups.length == 0) {
            groups_list.innerHTML = `
                    <div class="col-sm-6 col-md-4">
                        <div class="group-item">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="group-name">No public groups available. Create one!</div>
                                </div>
                            </div>
                        </div>
                    </div>`;
        }

        if (newGroupWidget) {
            groups_list.innerHTML +=
                `<div class="col-sm-6 col-md-4">
                     <div class="group-item">
                         <div class="row">
                             <form method="post" action="/groups/create">
                                 <div class="col-md-12">
                                     <input name="name" class="group-name" style="background:0;border:0;width:100%" value="Your group">
                                 </div>
                                 <div class="col-md-12 pull-right">
                                     <label tabindex="0" class="btn btn-default input-label" style="margin:6px">
                                         <input tabindex="-1" type="checkbox" name="public"> Public Group
                                     </label>
                                     <button class="btn btn-primary" style="margin:6px">Create Group</button>
                                 </div>
                             </form>
                         </div>
                     </div>
                 </div>`;
        }

        for (var label of document.getElementsByClassName('input-label')) {
            label.onkeydown = function(keydown) {
                if (keydown.code == 'Space') {
                    keydown.preventDefault();
                    keydown.target.firstElementChild.checked ^= true;
                }
                if (keydown.code == 'Enter') {
                    keydown.preventDefault();
                    keydown.target.closest('form').submit();
                }
            };
        }

        GM_setValue('groups-list-cache', {'html': groups_list.innerHTML, 'time': Date.now()});
    };

    request.open( "GET", groups_api );
    request.send();

    labelKeyDown = function(event) {
        if (event.code == 'Space') {
            event.preventDefault();
            event.target.firstElementChild.checked ^= true;
        }
        if (event.code == 'Enter') {
            event.preventDefault();
            event.target.closest('form').submit();
        }
    };

}