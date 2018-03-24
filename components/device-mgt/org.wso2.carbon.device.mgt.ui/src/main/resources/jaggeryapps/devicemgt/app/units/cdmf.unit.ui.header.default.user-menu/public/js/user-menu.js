/*
 * Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the
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

/*
 * Fix for the modal popup overlay disappear bug
 */
$('.modal').on('hidden.bs.modal', function () {
    if ($('.modal-backdrop').length == 2) {
        $('.modal-backdrop')[0].remove()
    }
});


$(document).ready(function () {
    var modalPopup = ".modal";
    // var modalPopupContainer = modalPopup + " .modal-content";
    var modalPopupContent = modalPopup + " .modal-content";

    $("#change-password").click(function () {

        $(modalPopupContent).html($('#change-password-window').html());
        showPopup();

        $("a#change-password-yes-link").click(function () {
            var currentPassword = $("#current-password").val();
            var newPassword = $("#new-password").val();
            var retypedNewPassword = $("#retyped-new-password").val();
            var user = $("#user").val();

            var errorMsgWrapper = "#change-password-error-msg";
            var errorMsg = "#change-password-error-msg span";
            if (!currentPassword) {
                $(errorMsg).text("输入您当前的密码是必需的。 它不能为空。");
                $(errorMsgWrapper).removeClass("hidden");
            } else if (!newPassword) {
                $(errorMsg).text("输入您当前的密码是必需的。 它不能为空。");
                $(errorMsgWrapper).removeClass("hidden");
            } else if (!retypedNewPassword) {
                $(errorMsg).text("新密码必填不能为空。");
                $(errorMsgWrapper).removeClass("hidden");
            } else if (retypedNewPassword != newPassword) {
                $(errorMsg).text("密码确认失败，请检查。");
                $(errorMsgWrapper).removeClass("hidden");
            } else if (!inputIsValid(/^[\S]{5,30}$/, newPassword)) {
                $(errorMsg).text("密码至少为5个字符且不能包含空格，请检查。");
                $(errorMsgWrapper).removeClass("hidden");
            } else {
                var changePasswordFormData = {};
                changePasswordFormData["oldPassword"] = unescape((currentPassword));
                changePasswordFormData["newPassword"] = unescape((newPassword));
                var changePasswordAPI = "/api/device-mgt/v1.0/users/credentials";
                invokerUtil.put(
                    changePasswordAPI,
                    changePasswordFormData,
                    function (data, textStatus, jqXHR) {
                        if (jqXHR.status == 200 && data) {
                            $(modalPopupContent).html($('#change-password-success-content').html());
                            $("#change-password-success-link").click(function () {
                                hidePopup();
                            });
                            setTimeout(function(){
                                window.location.href = "/devicemgt/logout";
                            },10000);
                        }
                    }, function (jqXHR) {
                        if (jqXHR.status == 400) {
                            $(errorMsg).text("您当前的密码与所提供的值不匹配。");
                            $(errorMsgWrapper).removeClass("hidden");
                        } else {
                            var response = JSON.parse(jqXHR.responseText).message;
                            $(errorMsg).text(response);
                            $(errorMsgWrapper).removeClass("hidden");
                        }
                    }
                );
            }

        });

        $("a#change-password-cancel-link").click(function () {
            hidePopup();
        });
    });
});
