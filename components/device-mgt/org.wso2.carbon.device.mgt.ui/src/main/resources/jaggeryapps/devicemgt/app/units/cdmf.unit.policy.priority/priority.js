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

function onRequest(context) {
    // var log = new Log("policy-listing.js");
    context.handlebars.registerHelper('equal', function (lvalue, rvalue, options) {
        if (arguments.length < 3)
            throw new Error("Handlebars 帮助工具中'equal'标签需要2个参数");
        if (lvalue != rvalue) {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    });
    var policyModule = require("/app/modules/business-controllers/policy.js")["policyModule"];
    var response = policyModule.getAllPolicies();

    if (response["status"] == "success") {
        var policyListToView = response["content"];
        context["policyListToView"] = policyListToView;
        var policyCount = policyListToView.length;
        if (policyCount == 0) {
            context["policyListingStatusMsg"] = "无可用策略显示。";
            context["saveNewPrioritiesButtonEnabled"] = false;
            context["noPolicy"] = true;
        } else if (policyCount == 1) {
            context["policyListingStatusMsg"] = "两个或更多策略来设置优先顺序是有用的。";
            context["saveNewPrioritiesButtonEnabled"] = false;
            context["noPolicy"] = false;
        } else {
            context["policyListingStatusMsg"] = "拖动并移动以重新排列策略优先级。";
            context["saveNewPrioritiesButtonEnabled"] = true;
            context["noPolicy"] = false;
        }
    } else {
        // here, response["status"] == "error"
        context["policyListToView"] = [];
        context["policyListingStatusMsg"] = "检索策略时出错。 请尝试重新加载页面。";
        context["saveNewPrioritiesButtonEnabled"] = false;
    }

    return context;
}
