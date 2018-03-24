/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Checks if provided input is valid against RegEx input.
 *
 * @param regExp Regular expression
 * @param inputString Input string to check
 * @returns {boolean} Returns true if input matches RegEx
 */
function inputIsValid(regExp, inputString) {
    regExp = new RegExp(regExp);
    return regExp.test(inputString);
}

$(function () {
    var sortableElem = '.wr-sortable';
    $(sortableElem).sortable({
        beforeStop: function () {
            $(this).sortable('toArray');
        }
    });
    $(sortableElem).disableSelection();
});

var apiBasePath = "/api/device-mgt/v1.0";
var body = "body";

/**
 *
 * Fires the res_text when ever a data table redraw occurs making
 * the font icons change the size to respective screen resolution.
 *
 */
$(document).on('draw.dt', function () {
    $(".icon .text").res_text(0.2);
});

/**
 * Following click function would execute
 * when a user clicks on "Invite" link
 * on User Management page in WSO2 MDM Console.
 */
$("a#invite-user-link").click(function () {
    var usernameList = getSelectedUsernames();
    var inviteUserAPI = apiBasePath + "/users/send-invitation";

    if (usernameList.length == 0) {
        modalDialog.header("无法执行操作 !");
        modalDialog.content("请选择一个或多个用户发送邀请电子邮件。");
        modalDialog.footer('<div class="buttons"> <a href="javascript:modalDialog.hide()" class="btn-operations">好的' +
            '</a> </div>');
        modalDialog.showAsError();
    } else {
        modalDialog.header("");
        modalDialog.content("邀请邮件将发送给选定的用户以开始注册过程。 您想继续吗 ?");
        modalDialog.footer('<div class="buttons"><a href="#" id="invite-user-yes-link" class="btn-operations">是的</a>' +
            '<a href="#" id="invite-user-cancel-link" class="btn-operations btn-default">不了</a></div>');
        modalDialog.show();

    }

    $("a#invite-user-yes-link").click(function () {
        invokerUtil.post(
            inviteUserAPI,
            usernameList,
            function () {
                modalDialog.header("用于注册的邀请用户电子邮件已成功发送。");
                modalDialog.content("");
                modalDialog.footer('<div class="buttons"><a href="#" id="invite-user-success-link" ' +
                    'class="btn-operations">好的 </a></div>');
                $("a#invite-user-success-link").click(function () {
                    modalDialog.hide();
                });
            },
            function (data) {
                var msg = JSON.parse(data.responseText);
                modalDialog.header('<span class="fw-stack"> <i class="fw fw-circle-outline fw-stack-2x"></i> <i class="fw ' +
                    'fw-error fw-stack-1x"></i> </span> 异常错误 !');
                modalDialog.content(msg.message);
                modalDialog.footer('<div class="buttons"><a href="#" id="invite-user-error-link" ' +
                    'class="btn-operations">好的 </a></div>');
                $("a#invite-user-error-link").click(function () {
                    modalDialog.hide();
                });
            }
        );
    });

    $("a#invite-user-cancel-link").click(function () {
        modalDialog.hide();
    });
});

/*
 * Function to get selected usernames.
 */
function getSelectedUsernames() {
    var usernameList = [];
    var userList = $("#user-grid").find("tr.DTTT_selected");
    userList.each(function () {
        usernameList.push($(this).data('username'));
    });
    return usernameList;
}

/**
 * Following click function would execute
 * when a user clicks on "Reset Password" link
 * on User Listing page in WSO2 MDM Console.
 */
function resetPassword(username) {
    modalDialog.header('<span class="fw-stack"> <i class="fw fw-circle-outline fw-stack-2x"></i> <i class="fw fw-key ' +
        'fw-stack-1x"></i> </span> 重置密码');
    modalDialog.content($("#modal-content-reset-password").html());
    modalDialog.footer('<div class="buttons"> <a href="#" id="reset-password-yes-link" class="btn-operations"> 保存 ' +
        '</a> <a href="#" id="reset-password-cancel-link" class="btn-operations btn-default"> 取消 </a> </div>');
    modalDialog.show();

    $("a#reset-password-yes-link").click(function () {
        var newPassword = $("#basic-modal-view .new-password").val();
        var confirmedPassword = $("#basic-modal-view .confirmed-password").val();
        var errorMsgWrapper = ".modal #notification-error-msg";
        var errorMsg = ".modal #notification-error-msg span";
        if (!newPassword) {
            $(errorMsg).text("新密码不能为空。");
            $(errorMsgWrapper).removeClass("hidden");
        } else if (!confirmedPassword) {
            $(errorMsg).text("重新输入新密码。");
            $(errorMsgWrapper).removeClass("hidden");
        } else if (confirmedPassword != newPassword) {
            $(errorMsg).text("新密码不匹配请确认。");
            $(errorMsgWrapper).removeClass("hidden");
        } else if (!inputIsValid(/^[\S]{5,30}$/, confirmedPassword)) {
            $(errorMsg).text("至少为5个字符，并且不包含空格。");
            $(errorMsgWrapper).removeClass("hidden");
        } else {
            var resetPasswordFormData = {};
            resetPasswordFormData.newPassword = unescape(confirmedPassword);
            var domain;
            if (username.indexOf('/') > 0) {
                domain = username.substr(0, username.indexOf('/'));
                username = username.substr(username.indexOf('/') + 1);
            }
            var resetPasswordServiceURL = apiBasePath + "/admin/users/" + encodeURIComponent(username) + "/credentials";
            if (domain) {
                resetPasswordServiceURL += '?domain=' + encodeURIComponent(domain);
            }
            invokerUtil.post(
                resetPasswordServiceURL,
                resetPasswordFormData,
                // The success callback
                function (data, textStatus, jqXHR) {
                    if (jqXHR.status == 200) {
                        modalDialog.header("密码重置成功。");
                        modalDialog.content("");
                        modalDialog.footer('<div class="buttons"> <a href="javascript:modalDialog.hide()" ' +
                            'class="btn-operations">好的</a> </div>');
                    }
                },
                // The error callback
                function (jqXHR) {
                    var payload = JSON.parse(jqXHR.responseText);
                    $(errorMsg).text(payload.message);
                    $(errorMsgWrapper).removeClass("hidden");
                }
            );
        }
    });

    $("a#reset-password-cancel-link").click(function () {
        modalDialog.hide();
    });
}

/**
 * Following click function would execute
 * when a user clicks on "Remove" link
 * on User Listing page in WSO2 MDM Console.
 */
function removeUser(username) {
    var domain;
    if (username.indexOf('/') > 0) {
        domain = username.substr(0, username.indexOf('/'));
        username = username.substr(username.indexOf('/') + 1);
    }
    var removeUserAPI = apiBasePath + "/users/" + encodeURIComponent(username);
    if (domain) {
        removeUserAPI += '?domain=' + encodeURIComponent(domain);
    }
    modalDialog.header("删除用户");
    modalDialog.content("您真的要删除该用户吗 ?");
    modalDialog.footer('<div class="buttons"> <a href="#" id="remove-user-yes-link" class="btn-operations">删除</a> ' +
        '<a href="#" id="remove-user-cancel-link" class="btn-operations btn-default">取消</a> </div>');
    modalDialog.showAsAWarning();

    $("a#remove-user-cancel-link").click(function () {
        modalDialog.hide();
    });

    $("a#remove-user-yes-link").click(function () {
        invokerUtil.delete(
            removeUserAPI,
            function (data, textStatus, jqXHR) {
                if (jqXHR.status == 200) {
                    if (domain) {
                        username = domain + '/' + username;
                    }
                    $('[id="user-' + username + '"]').remove();
                    // update modal-content with success message
                    modalDialog.header("用户已删除。");
                    modalDialog.content("用户成功被删除。");
                    modalDialog.footer('<div class="buttons"> <a href="javascript:modalDialog.hide()" ' +
                        'class="btn-operations">好的</a> </div>');

                }
            },
            function () {
                modalDialog.hide();
                modalDialog.header("无法执行操作 !");
                modalDialog.content("一个异常问题发生。 请稍后再试。");
                modalDialog.footer('<div class="buttons"> <a href="javascript:modalDialog.hide()" ' +
                    'class="btn-operations">好的</a> </div>');
                modalDialog.showAsError();
            }
        );
    });

}

/**
 * Following function would execute
 * when a user clicks on the list item
 * initial mode and with out select mode.
 */
function InitiateViewOption() {
    if ($("#can-view").val()) {
        $(location).attr('href', $(this).data("url"));
    } else {
        modalDialog.header("未经授权的操作!");
        modalDialog.content("您无权查看用户");
        modalDialog.footer('<div class="buttons"> <a href="javascript:modalDialog.hide()" class="btn-operations">好的</a> </div>');
        modalDialog.showAsError();
    }
}

function htmlspecialchars(text){
    return jQuery('<div/>').text(text).html();
}

function loadUsers() {
    var loadingContentView = "#loading-content";
    $(loadingContentView).show();

    var dataFilter = function (data) {
        data = JSON.parse(data);

        var objects = [];

        $(data.users).each(function (index) {
            objects.push({
                filter: htmlspecialchars(data.users[index].username),
                firstname: htmlspecialchars(data.users[index].firstname) ? htmlspecialchars(data.users[index].firstname) : "",
                lastname: htmlspecialchars(data.users[index].lastname) ? htmlspecialchars(data.users[index].lastname) : "",
                emailAddress: htmlspecialchars(data.users[index].emailAddress) ? htmlspecialchars(data.users[index].emailAddress) : "",
                DT_RowId: "user-" + htmlspecialchars(data.users[index].username)
            })
        });

        var json = {
            "recordsTotal": data.count,
            "recordsFiltered": data.count,
            "data": objects
        };

        return JSON.stringify(json);
    };

    //noinspection JSUnusedLocalSymbols
    var fnCreatedRow = function (nRow, aData, iDataIndex) {
        var adminUser = $("#user-table").data("user");
        if (adminUser !== aData["filter"]) {
            $(nRow).attr('data-type', 'selectable');
        }
        $(nRow).attr('data-username', aData["filter"]);
    };

    //noinspection JSUnusedLocalSymbols
    var columns = [
        {
            class: "remove-padding icon-only content-fill",
            data: null,
            render: function (data, type, row, meta) {
                return '<div class="thumbnail icon viewEnabledIcon" data-url="' + context + '/user/view?username=' + data.filter + '">' +
                    '<i class="square-element text fw fw-user" style="font-size: 74px;"></i>' +
                    '</div>';
            }
        },
        {
            class: "",
            data: null,
            render: function (data, type, row, meta) {
                if (!data.firstname && !data.lastname) {
                    return "";
                } else if (data.firstname && data.lastname) {
                    return "<h4>" + data.firstname + " " + data.lastname + "</h4>";
                }
            }
        },
        {
            class: "remove-padding-top",
            data: 'filter',
            render: function (filter, type, row, meta) {
                return '<i class="fw-user"></i>' + filter;
            }
        },
        {
            class: "remove-padding-top",
            data: null,
            render: function (data, type, row, meta) {
                if (!data.emailAddress) {
                    return "";
                } else {
                    return "<a href='mailto:" + data.emailAddress + "' ><i class='fw-mail'></i>" + data.emailAddress + "</a>";
                }
            }
        },
        {
            class: "text-right content-fill text-left-on-grid-view no-wrap tooltip-overflow-fix",
            data: null,
            render: function (data, type, row, meta) {
                var editbtn = '<a data-toggle="tooltip" data-placement="top" title="Edit User"href="' + context +
                    '/user/edit?username=' + encodeURIComponent(data.filter) + '" data-username="' + data.filter + '" ' +
                    'data-click-event="edit-form" ' +
                    'class="btn padding-reduce-on-grid-view edit-user-link" data-placement="top" data-toggle="tooltip" data-original-title="Edit"> ' +
                    '<span class="fw-stack"> ' +
                    '<i class="fw fw-circle-outline fw-stack-2x"></i>' +
                    '<i class="fw fw-edit fw-stack-1x"></i>' +
                    '</span><span class="hidden-xs hidden-on-grid-view">修改</span></a>';

                var resetPasswordbtn = '<a data-toggle="tooltip" data-placement="top" title="Reset Password" href="#" data-username="' + data.filter + '" data-userid="' + data.filter + '" ' +
                    'data-click-event="edit-form" ' +
                    'onclick="javascript:resetPassword(\'' + data.filter + '\')" ' +
                    'class="btn padding-reduce-on-grid-view remove-user-link" data-placement="top" data-toggle="tooltip" data-original-title="Reset Password">' +
                    '<span class="fw-stack">' +
                    '<i class="fw fw-circle-outline fw-stack-2x"></i>' +
                    '<i class="fw fw-key fw-stack-1x"></i>' +
                    '</span><span class="hidden-xs hidden-on-grid-view">重置密码</span></a>';

                var removebtn = '<a data-toggle="tooltip" data-placement="top" title="Remove User" href="#" data-username="' + data.filter + '" data-userid="' + data.filter + '" ' +
                    'data-click-event="remove-form" ' +
                    'onclick="javascript:removeUser(\'' + data.filter + '\')" ' +
                    'class="btn padding-reduce-on-grid-view remove-user-link" data-placement="top" data-toggle="tooltip" data-original-title="Remove">' +
                    '<span class="fw-stack">' +
                    '<i class="fw fw-circle-outline fw-stack-2x"></i>' +
                    '<i class="fw fw-delete fw-stack-1x"></i>' +
                    '</span><span class="hidden-xs hidden-on-grid-view">删除</span></a>';

                var returnbtnSet = '';
                var adminUser = $("#user-table").data("user");
                var currentUser = $("#user-table").data("logged-user");
                if ($("#can-edit").length > 0 && adminUser !== data.filter) {
                    returnbtnSet = returnbtnSet + editbtn;
                }
                if ($("#can-reset-password").length > 0 && adminUser !== data.filter) {
                    returnbtnSet = returnbtnSet + resetPasswordbtn;
                }
                if ($("#can-remove").length > 0 && adminUser !== data.filter && currentUser !== data.filter) {
                    returnbtnSet = returnbtnSet + removebtn;
                }

                return returnbtnSet;
            }
        }

    ];

    var options = {
        "placeholder": "按用户名搜索",
        "searchKey": "filter"
    };

    var settings = {
        "sorting": false
    };

    $('#user-grid').datatables_extended_serverside_paging(settings, '/api/device-mgt/v1.0/users', dataFilter, columns, fnCreatedRow, null, options);
    $(loadingContentView).hide();

}

$(document).ready(function () {
    loadUsers();
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });
    if (!$("#can-invite").val()) {
        $("#invite-user-button").remove();
    }

});
