
'use strict';

const blockfun = function(event){
    event.preventDefault();
    event.stopPropagation();
}
window.addEventListener('load', function() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');

    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function(form) {
                form.addEventListener('submit', function(event) {
                    if (form.checkValidity() === false) {
                        blockfun(event);
                    }
                    
                    form.classList.add('was-validated');
                }, false /*optional bubbling/caputring */);
    });

}, false/*optional bubbling/caputring */);






// const check_form = function(event){
    
    // var name, roll;
    // var regE = /^[0-9A-Za-z]+$/i, regE1 = /^[A-Za-z]+$/i;
    // name = form.sname.value;
    // roll = form.sroll.value;
    // email = form.email.value;

    // if(!regE1.test(name)){
        /* apply custome css */
    //     blockfun(event);
    // }

    // else if(!regE.test(roll)){
        /* apply custome css */
    //     blockfun(event);
    // }else{
    // }

// }

// var forms = document.getElementsByClassName("needs-validation");
// forms[0].addEventListener("submit", check_form);