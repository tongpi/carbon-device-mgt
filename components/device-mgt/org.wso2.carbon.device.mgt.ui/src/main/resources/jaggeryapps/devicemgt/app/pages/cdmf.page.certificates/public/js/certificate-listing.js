/*
 * Sorting function of certificates
 * listed on Certificate Management page in WSO2 MDM Console.
 */
$(function () {
    var sortableElem = '.wr-sortable';
    $(sortableElem).sortable({
        beforeStop: function () {
            var sortedIDs = $(this).sortable('toArray');
        }
    });
    $(sortableElem).disableSelection();
});

var modalPopup = ".modal";
var modalPopupContainer = modalPopup + " .modal-content";
var modalPopupContent = modalPopup + " .modal-content";
var body = "body";
var isInit = true;

var base_api_url = "/api/certificate-mgt/v1.0";

$(".icon .text").res_text(0.2);

/*
 * set popup maximum height function.
 */
function setPopupMaxHeight() {
    $(modalPopupContent).css('max-height', ($(body).height() - ($(body).height() / 100 * 30)));
    $(modalPopupContainer).css('margin-top', (-($(modalPopupContainer).height() / 2)));
}

/*
 * show popup function.
 */
function showPopup() {
    $(modalPopup).modal('show');
}

/*
 * hide popup function.
 */
function hidePopup() {
    $(modalPopupContent).html('');
    $(modalPopup).modal('hide');
    $('body').removeClass('modal-open').css('padding-right','0px');
    $('.modal-backdrop').remove();
}

/**
 * Following click function would execute
 * when a user clicks on "Remove" link
 * on Certificate Listing page in WSO2 MDM Console.
 */
function removeCertificate(serialNumber) {
    var serviceUrl = base_api_url + "/admin/certificates/" + serialNumber;
    modalDialog.header('你真的想删除这个证书吗？');
    modalDialog.footer('<div class="buttons"><a href="#" id="remove-certificate-yes-link" class="btn-operations">' +
        '删除</a><a href="#" id="remove-certificate-cancel-link" class="btn-operations btn-default">取消</a>' +
        '</div>');
    modalDialog.show();

    $("a#remove-certificate-yes-link").click(function () {
        invokerUtil.delete(
            serviceUrl,
            function () {
                $("#" + serialNumber).remove();
                var newCertificateListCount = $(".user-list > span").length;
                $("#certificate-listing-status-msg").text("Total number of Certificates found : " +
                    newCertificateListCount);
                modalDialog.header('完成。证书删除成功。');
                modalDialog.footer('<div class="buttons"><a href="#" id="remove-certificate-success-link" ' +
                    'class="btn-operations">Ok</a></div>');
                $("a#remove-certificate-success-link").click(function () {
                    modalDialog.hide();
                });
            },
            function () {
                modalDialog.header('出现异常错误。请稍后再试。');
                modalDialog.footer('<div class="buttons"><a href="#" id="remove-certificate-error-link" ' +
                    'class="btn-operations">好的</a></div>');
                modalDialog.showAsError();
                $("a#remove-certificate-error-link").click(function () {
                    modalDialog.hide();
                });
            }
        );
    });

    $("a#remove-certificate-cancel-link").click(function () {
        modalDialog.hide();
    });
}

/**
 * Following on click function would execute
 * when a user type on the search field on certificate Listing page in
 * WSO2 MDM Console then click on the search button.
 */
$("#search-btn").click(function () {
    var searchQuery = $("#search-by-certificate").val();
    $("#ast-container").empty();
    loadCertificates(searchQuery);
});

/**
 * Following function would execute
 * when a user clicks on the list item
 * initial mode and with out select mode.
 */
function InitiateViewOption() {
    if ($("#can-view").val()) {
        $(location).attr('href', $(this).data("url"));
    } else {
        modalDialog.header('未经授权的行为!');
        modalDialog.content('您无权查看此证书。');
        modalDialog.showAsAWarning();
    }
}

function loadCertificates(searchParam) {
    $("#loading-content").show();
    var certificateListing = $("#certificate-listing");
    var certificateListingSrc = certificateListing.attr("src");
    $.template("certificate-listing", certificateListingSrc, function (template) {
        var serviceURL = base_api_url + "/admin/certificates";

        if (searchParam != null && searchParam != undefined && searchParam.trim() != '') {
            serviceURL = base_api_url + "/admin/certificates?" + searchParam;
        }

        var successCallback = function (data, textStatus, jqXHR) {
            if (jqXHR.status == 200 && data) {
                data = JSON.parse(data);

                var viewModel = {};
                viewModel.certificates = data.certificates;

                for (var i = 0; i < viewModel.certificates.length; i++) {
                    viewModel.certificates[i].removePermitted = true;
                    viewModel.certificates[i].viewPermitted = true;
                }

                if (viewModel.certificates.length > 0) {
                    $('#certificate-table').removeClass('hidden');
                    $('#ast-container').removeClass('hidden');
                    $('#certificate-listing-status-msg').text("");
                    var content = template(viewModel);
                    $("#ast-container").html(content);
                } else {
                    $('#certificate-table').addClass('hidden');
                    $('#certificate-listing-status-msg').text('没有有效的证书可显示。');
                    $('#certificate-listing-status').removeClass('hidden');
                }

                $("#loading-content").hide();

                if (isInit) {
                    $('#certificate-grid').datatables_extended();
                    isInit = false;
                }

                $(".icon .text").res_text(0.2);
            }
        };
        invokerUtil.get(serviceURL,
            successCallback,
            function (message) {
                $('#ast-container').addClass('hidden');
                $('#certificate-listing-status-msg').
                    text('无效的搜索查询。 再次尝试使用有效的搜索查询。');
            }
        );
    });
}

$(document).ready(function () {
    loadCertificates();

    $(".viewEnabledIcon").click(function () {
        InitiateViewOption();
    });
});
