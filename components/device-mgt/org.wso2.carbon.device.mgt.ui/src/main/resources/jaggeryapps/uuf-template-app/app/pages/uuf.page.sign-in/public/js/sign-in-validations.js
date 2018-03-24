$(document).ready(function(){
    $("#signInForm").validate({
        rules: {
            username: {
                required: true,
                minlength: 3
            },
            password: {
                required: true,
                minlength: 3
            }
        },
        messages: {
            username: {
                required: "请输入用户名",
                minlength: "用户名至少为3个字符长度"
            },
            password: {
                required: "请输入密码",
                minlength: "密码至少为3个字符长度"
            }
        }
    });
});
