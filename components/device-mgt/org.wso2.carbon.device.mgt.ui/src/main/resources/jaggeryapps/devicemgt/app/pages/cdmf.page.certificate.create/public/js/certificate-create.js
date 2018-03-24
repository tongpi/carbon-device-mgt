/*
 Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.

 WSO2 Inc. licenses this file to you under the Apache License,
 Version 2.0 (the "License"); you may not use this file except
 in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the
 specific language governing permissions and limitations
 under the License.
 */
var pemContent = "";
var errorMsgWrapper = "#certificate-create-error-msg";
var errorMsg = "#certificate-create-error-msg span";
var validateInline = {};
var clearInline = {};

var base_api_url = "/api/certificate-mgt/v1.0";

var enableInlineError = function (inputField, errorMsg, errorSign) {
    var fieldIdentifier = "#" + inputField;
    var errorMsgIdentifier = "#" + inputField + " ." + errorMsg;
    var errorSignIdentifier = "#" + inputField + " ." + errorSign;

    if (inputField) {
        $(fieldIdentifier).addClass(" has-error has-feedback");
    }

    if (errorMsg) {
        $(errorMsgIdentifier).removeClass(" hidden");
    }

    if (errorSign) {
        $(errorSignIdentifier).removeClass(" hidden");
    }
};

var disableInlineError = function (inputField, errorMsg, errorSign) {
    var fieldIdentifier = "#" + inputField;
    var errorMsgIdentifier = "#" + inputField + " ." + errorMsg;
    var errorSignIdentifier = "#" + inputField + " ." + errorSign;

    if (inputField) {
        $(fieldIdentifier).removeClass(" has-error has-feedback");
    }

    if (errorMsg) {
        $(errorMsgIdentifier).addClass(" hidden");
    }

    if (errorSign) {
        $(errorSignIdentifier).addClass(" hidden");
    }
};

function readSingleFile(evt) {
    var f = evt.target.files[0];
    if (f) {
        var r = new FileReader();
        r.onload = function (e) {
            var contents = e.target.result;
            if (f.type == "application/x-x509-ca-cert") {
                pemContent = contents;
                console.log(contents);
                console.log(pemContent);
                pemContent = pemContent.substring(28, pemContent.length - 27);
                console.log(pemContent);
                $(errorMsgWrapper).addClass("hidden");
            } else {
                $(errorMsg).text("证书必须是包含有效证书数据的.pem文件。");
                $(errorMsgWrapper).removeClass("hidden");
            }
        }
        r.readAsText(f);
    } else {
        //inline error
    }
}

$(document).ready(function () {
    pemContent = "";
    document.getElementById('certificate').addEventListener('change', readSingleFile, false);

    /**
     * Following click function would execute
     * when a user clicks on "Add Certificate" button.
     */
    $("button#add-certificate-btn").click(function () {
        var serialNoInput = $("input#serialNo");
        var serialNo = serialNoInput.val();
        if (!serialNo) {
            $(errorMsg).text("证书编号不能为空。");
            $(errorMsgWrapper).removeClass("hidden");
        } else if (!pemContent) {
            $(errorMsg).text(" .pem文件必须包含证书信息。");
            $(errorMsgWrapper).removeClass("hidden");
        } else {
            var addCertificateFormData = {};
            addCertificateFormData.serial = serialNo;
            addCertificateFormData.pem = pemContent;
            var certificateList = [];
            certificateList.push(addCertificateFormData);

            var serviceUrl = base_api_url + "/admin/certificates";
            invokerUtil.post(
                serviceUrl,
                certificateList,
                function (data) {
                    // Refreshing with success message
                    $("#certificate-create-form").addClass("hidden");
                    $("#certificate-created-msg").removeClass("hidden");
                }, function (data) {
                    if (data["status"] == 500) {
                        $(errorMsg).text("后端发生异常错误。请稍后再试。");
                    } else {
                        $(errorMsg).text(data);
                    }
                    $(errorMsgWrapper).removeClass("hidden");
                }
            );
        }
    });
});
