
    function reformatRadius(val){
        if(val != "" && !isNaN(val)){
            $("#fRadius" ).val(parseFloat(Math.round(val * 100) / 100).toFixed(2));
        } else{
            var message = "提供的波动半径无效。";
            noty({text: message, type: 'error'});
        }
    }

