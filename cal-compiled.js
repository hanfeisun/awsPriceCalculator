"use strict"

// Utils
;
var $id = function (idSelector) {
    return document.getElementById(idSelector);
},
    $class = function (classSelector) {
    return document.getElementsByClassName(classSelector);
},
    $get = function (node) {
    if (typeof node === "string") {
        node = $id(node);
    }
    if (node.nodeName == "INPUT") {
        return parseFloat(node.value);
    } else {
        return parseFloat(node.innerText);
    }
},
    $set = function (node, value) {
    var result = value;
    if (typeof node === "string") {
        node = $id(node);
    }
    if (node.nodeName == "INPUT") {
        node.value = result;
    } else {
        node.innerText = result;
    }
},
    step_minus = function (a, b) {
    if (a < b) {
        return 0;
    } else {
        return a - b;
    }
};

var view = {
    subscribe: function (selector) {
        var self = this,
            e = $id(selector);

        e.oninput = function () {
            self.model.notify();
            self.update();
        };
        e.onpropertychange = e.oninput;
    },
    bind: function (selector, propFunc) {
        this.bindList[selector] = propFunc;
    }

};

var AwsView = function (awsModel) {
    var self = this;

    self.save = function () {
        var elems = $class("model");
        self.model.saved = {};

        for (var i = 0; i < elems.length; i++) {
            self.model.saved[elems[i].id] = $get(elems[i]);
        }
    };

    self.restore = function () {
        var saved = self.model.saved;
        for (var prop in saved) {
            if (saved.hasOwnProperty(prop)) {
                $set(prop, saved[prop]);
            }
        }
    };

    self.compare = function () {
        var saved = self.model.saved;
        var transform = function (num, fixDecimal) {
            var result;
            result = num.toFixed(fixDecimal);
            if (num > 0) {
                result = "+" + result;
            }
            return result.replace("+", "↑ ").replace("-", "↓ ");
        };

        for (var prop in saved) {
            if (saved.hasOwnProperty(prop)) {

                var newVal = $get(prop),
                    oldVal = saved[prop],
                    delta = newVal - oldVal,
                    e = $id(prop + "_delta");
                if (prop.endsWith("unit")) {
                    $set(e, transform(delta, 2));
                } else {
                    $set(e, transform(delta, 1));
                }

                if (delta === 0) {
                    e.classList.remove("delta-inc");
                    e.classList.remove("delta-dec");
                } else if (delta > 0) {
                    e.classList.add("delta-inc");
                    e.classList.remove("delta-dec");
                } else {
                    e.classList.add("delta-dec");
                    e.classList.remove("delta-inc");
                }
            }
        }
    };

    self.update = function () {
        for (var selector in self.bindList) {
            if (self.bindList.hasOwnProperty(selector)) {
                var computedProp = self.model[self.bindList[selector]]();
                if (selector.endsWith("unit")) {
                    $set(selector, computedProp.toFixed(2));
                } else {
                    $set(selector, computedProp.toFixed(1));
                }
            }
        }
        self.compare();
    };

    self.initDelta = function () {
        var e,
            delElem,
            elems = $class("model");
        for (var i = 0; i < elems.length; i++) {
            e = elems[i];
            delElem = document.createElement("span");
            delElem.classList.add("delta");
            delElem.id = e.id + "_delta";
            delElem.innerText = "";
            e.parentNode.insertBefore(delElem, e.nextSibling);
        }
        self.save();
    };

    self.bind3 = function (outputSelector, propFunc, inputSelectorArray) {
        this.bind(outputSelector, propFunc);

        for (var i = 0; i < inputSelectorArray.length; i++) {
            // Hover input box
            $id(inputSelectorArray[i]).addEventListener("mouseover", function () {
                this.previousElementSibling.classList.add("related");
                $id(outputSelector).previousElementSibling.classList.add("related");
            });
            $id(inputSelectorArray[i]).addEventListener("mouseout", function () {
                this.previousElementSibling.classList.remove("related");
                $id(outputSelector).previousElementSibling.classList.remove("related");
            });

            // Hover label of input box
            $id(inputSelectorArray[i]).previousElementSibling.addEventListener("mouseover", function () {
                this.classList.add("related");
                $id(outputSelector).previousElementSibling.classList.add("related");
            });

            $id(inputSelectorArray[i]).previousElementSibling.addEventListener("mouseout", function () {
                this.classList.remove("related");
                $id(outputSelector).previousElementSibling.classList.remove("related");
            });
        }

        // Hover output text
        $id(outputSelector).addEventListener("mouseover", function () {
            this.previousElementSibling.classList.add("related");
            for (var i = 0; i < inputSelectorArray.length; i++) {
                $id(inputSelectorArray[i]).previousElementSibling.classList.add("related");
            }
        });

        $id(outputSelector).addEventListener("mouseout", function () {
            this.previousElementSibling.classList.remove("related");
            for (var i = 0; i < inputSelectorArray.length; i++) {
                $id(inputSelectorArray[i]).previousElementSibling.classList.remove("related");
            }
        });

        // Hover label of output text
        $id(outputSelector).previousElementSibling.addEventListener("mouseover", function () {
            this.classList.add("related");
            for (var i = 0; i < inputSelectorArray.length; i++) {
                $id(inputSelectorArray[i]).previousElementSibling.classList.add("related");
            }
        });

        $id(outputSelector).previousElementSibling.addEventListener("mouseout", function () {
            this.classList.remove("related");
            for (var i = 0; i < inputSelectorArray.length; i++) {
                $id(inputSelectorArray[i]).previousElementSibling.classList.remove("related");
            }
        });
    };

    self.model = awsModel;
    self.subscribe("p_user");
    self.subscribe("p_new_moment");
    self.subscribe("p_avg_length");
    self.subscribe("p_audience");
    self.subscribe("p_session");
    self.subscribe("p_session_length");
    self.subscribe("p_mbps");
    self.bindList = {};

    self.bind3("v_up", "d_upload_GB", ["p_user", "p_new_moment", "p_avg_length", "p_mbps"]);
    self.bind3("v_up_c", "d_upload_cumulative_GB", ["p_user", "p_new_moment", "p_avg_length", "p_mbps", "v_up"]);
    self.bind3("v_down", "d_download_GB", ["p_audience", "p_session", "p_session_length", "p_mbps"]);

    self.bind3("v_s3", "s3", ["p_user", "p_new_moment", "p_avg_length", "p_mbps", "v_up_c", "v_s3_unit"]);
    self.bind3("v_transcoder", "transcoder", ["p_user", "p_new_moment", "p_avg_length", "p_mbps", "v_up"]);
    self.bind3("v_cdn", "cdn", ["p_audience", "p_session", "p_session_length", "p_mbps", "v_down", "v_up"]);

    self.bind3("v_s3_unit", "s3_unit", []);
    self.bind3("v_transcoder_unit", "transcoder_unit", ["p_mbps"]);
    self.bind3("v_cdn_unit", "cdn_unit", ["p_audience", "p_session", "p_session_length", "p_mbps", "v_down", "v_up"]);

    self.bind3("v_total", "total", ["v_s3", "v_transcoder", "v_cdn"]);

    $id("b_delta").addEventListener("click", function () {
        var elements = $class("delta");
        for (var i = 0; i < elements.length; i++) {
            elements[i].classList.toggle("hide");
        }
    });

    $id("b_save").addEventListener("click", function () {
        self.save();
        self.compare();
    });

    $id("b_restore").addEventListener("click", function () {
        self.restore();
        self.compare();
    });
};

AwsView.prototype = view;

var AwsModel = function () {
    this.notify = this.parseAll;
    this.notify();
};

AwsModel.prototype.parseAll = function () {
    this.p_user = $get("p_user");
    this.p_new_moment = $get("p_new_moment");
    this.p_avg_minute = $get("p_avg_length");
    this.p_audience = $get("p_audience");
    this.p_session = $get("p_session");
    this.p_session_minute = $get("p_session_length");
    this.p_mbps = $get("p_mbps");
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

AwsModel.prototype.s3_unit = function () {
    return 0.13;
};

AwsModel.prototype.transcoder = function () {
    // https://aws.amazon.com/elastictranscoder/pricing/
    return 0.03 * this.t_upload_minute();
};

AwsModel.prototype.transcoder_unit = function () {
    return this.transcoder() / this.d_upload_GB();
};

AwsModel.prototype.cdn = function () {
    var up_size = this.d_upload_GB(),
        down_size = this.d_download_GB();

    // https://aws.amazon.com/cloudfront/pricing/
    var up_price = up_size * 0.02,
        down_price = Math.min(down_size, 10000) * 0.085 + Math.min(step_minus(down_size, 10000), 40000) * 0.08 + Math.min(step_minus(down_size, 50000), 100000) * 0.06 + Math.min(step_minus(down_size, 150000), 350000) * 0.04 + Math.min(step_minus(down_size, 500000), 524000) * 0.03 + Math.min(step_minus(down_size, 1024000), 4000000) * 0.025 + step_minus(down_size, 5024000) * 0.020;
    return up_price + down_price;
};

AwsModel.prototype.cdn_unit = function () {
    return this.cdn() / this.d_download_GB();
};

AwsModel.prototype.total = function () {
    return this.s3() + this.transcoder() + this.cdn();
};

//# sourceMappingURL=cal-compiled.js.map