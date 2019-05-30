var UserController = (function () {
    var self = {};


    self.showLoginDialog = function () {

        $("#LoginModalMenu").modal("show")

    }


    self.addUser = function () {

    }

    self.loadUser = function () {

    }


    self.login = function () {

        var login = $("#login_user").val();
        var password = $("#login_password").val();
        var payload = {
            checkLogin: true,
            login: login,
            password: password
        }

        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err)
                return $("#LoginMessageDiv").html(err);
            context.user = result;
            context.user.login=login;
            $("#LoginModalMenu").removeClass("show")
            $("#LoginModalMenu").modal("hide")
            MainController.init();

            GraphController.setSavedGraphSelect();

        })


    }

    self.saveUser=function(){
        var payload = {
            setUserData: true,
            login: context.user.login,
            data:JSON.stringify(context.user)
        }

        MainController.callServer(MainController.jsonDBStoragePath, payload, function (err, result) {
            if (err)
                return $("#LoginMessageDiv").html(err);


        })






    }


    return self;


})()