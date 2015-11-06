"use strict"

// Utils
;
var $ = function (idSelector) {
    return document.getElementById.apply(document, [idSelector.replace("#", "")]);
},
    parse = function (selector) {
    return parseFloat($(selector).value);
},
    step_minus = function (a, b) {
    if (a < b) {
        return 0;
    } else {
        return a - b;
    }
};

var View = {
    subscribe: function (selector) {
        var self = this,
            e = $(selector);

        e.oninput = function () {
            self.model.notify();
            self.update();
        };
        e.onpropertychange = e.oninput;
    },
    bind: function (selector, propFunc) {
        this.bindList[selector] = propFunc;
    },
    update: function () {
        for (var selector in this.bindList) {
            $(selector).innerText = this.model[this.bindList[selector]]().toFixed(2);
        }
    }

};

var AwsView = function (awsModel) {
    this.model = awsModel;
    this.subscribe("#p_user");
    this.subscribe("#p_user");
    this.subscribe("#p_new_moment");
    this.subscribe("#p_avg_length");
    this.subscribe("#p_audience");
    this.subscribe("#p_session");
    this.subscribe("#p_session_length");
    this.subscribe("#p_mbps");
    this.bindList = {};
    this.bind("#v_s3", "s3");
    this.bind("#v_transcoder", "transcoder");
    this.bind("#v_cdn", "cdn");
    this.bind("#v_total", "total");
    this.bind("#v_up", "d_upload_GB");
    this.bind("#v_down", "d_download_GB");
    this.bind("#v_up_c", "d_upload_cumulative_GB");
};

AwsView.prototype = View;

var AwsModel = function () {
    this.notify = this.parseAll;
    this.notify();
};

AwsModel.prototype.parseAll = function () {
    this.p_user = parse("#p_user");
    this.p_new_moment = parse("#p_new_moment");
    this.p_avg_minute = parse("#p_avg_length");
    this.p_audience = parse("#p_audience");
    this.p_session = parse("#p_session");
    this.p_session_minute = parse("#p_session_length");
    this.p_mbps = parse("#p_mbps");
};

AwsModel.prototype.t_upload_minute = function () {
    return this.p_user * this.p_new_moment * this.p_avg_minute;
};

AwsModel.prototype.t_acc_minute = function () {
    // TODO: use real cumulative length
    return this.t_upload_minute();
};

AwsModel.prototype.t_download_minute = function () {

    return this.p_audience * this.p_session * this.p_session_minute;
};

AwsModel.prototype.data_size_GB = function (minute) {
    return minute * 60 * this.p_mbps / (8 * 1024);
};

AwsModel.prototype.d_upload_GB = function () {
    return this.data_size_GB(this.t_upload_minute());
};

AwsModel.prototype.d_upload_cumulative_GB = function () {
    return this.data_size_GB(this.t_acc_minute());
};

AwsModel.prototype.d_download_GB = function () {
    return this.data_size_GB(this.t_download_minute());
};

AwsModel.prototype.s3 = function () {

    // https://aws.amazon.com/s3/pricing/
    // Note: "Standard - Infrequent Access Storage" price in United States
    // Actual price is $0.125 per GB, use $0.13 to compensate Request price
    return 0.13 * this.d_upload_cumulative_GB();
};

AwsModel.prototype.transcoder = function () {
    // https://aws.amazon.com/elastictranscoder/pricing/
    return 0.03 * this.d_upload_GB();
};

AwsModel.prototype.cdn = function () {
    var up_size = this.d_upload_GB(),
        down_size = this.d_download_GB();

    // https://aws.amazon.com/cloudfront/pricing/

    var up_price = up_size * 0.02,
        down_price = Math.min(down_size, 10000) * 0.085 + Math.min(step_minus(down_size, 10000), 40000) * 0.08 + Math.min(step_minus(down_size, 50000), 100000) * 0.06 + Math.min(step_minus(down_size, 150000), 350000) * 0.04 + Math.min(step_minus(down_size, 500000), 524000) * 0.03 + Math.min(step_minus(down_size, 1024000), 4000000) * 0.025 + step_minus(down_size, 5024000) * 0.020;
    return up_price + down_price;
};

AwsModel.prototype.total = function () {
    return this.s3() + this.transcoder() + this.cdn();
};

//# sourceMappingURL=cal-compiled.js.map