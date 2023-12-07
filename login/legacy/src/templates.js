const loginTemplate = `
    <style>
        .login-input:focus {
            outline: 1px solid #333;
        }

        #submitform:focus {
            background: #dbdbdb;
        }
    </style>

    <div class="login-form" style="font-family: sans-serif;">
        <div style="font-size: 12px; color: #e47979;" id="login_error"></div>
        <label for="email" style="text-align: left; margin-top: 20px; color: #9D9D9D;">{{ email }}</label> <br>
        <input class="login-input"  type="email" style="padding: 1em 0px 1em 15px; width: calc(100% - 15px); border: 1px solid #404040; border-radius: 4px; margin-bottom: 20px; margin-top: 5px;" id='cdf_identifiantInput' name='cdf_identifiantInput'><br>

        <div style="font-size: 12px; color: #e47979;" id="password_error"></div>
        <label for="password" style="text-align: left; margin-top: 20px; color: #9D9D9D;">{{ password }}</label> <br>
        <input class="login-input" type="password" style="padding: 1em 0px 1em 15px; width: calc(100% - 15px); border: 1px solid #404040; border-radius: 4px; margin-bottom: 20px; margin-top: 5px;" id='cdf_passwordInput' name='cdf_passwordInput'> <br>

        <button id="submitform" type="submit" style="cursor: pointer; padding: 1em; margin-top: 20px; width: 100%; background: #F3F3F3; border: 1px solid #e2e2e2; border-radius: 5px; cursor: pointer; font-size: 16px; color: #707070;" value="Se connecter">{{ login }}</button>
        <div style="text-align: center; font-size: 14px; margin-top: 30px; color: #c4c4c4;">
            <p style="padding:10px;" ><a style="padding:10px; color: #1e9dcf;" href="/register" target="angular" style="color: #5791C8;">{{ noAccount }}</a></p>
            <p style="padding:10px; margin-bottom: 30px;"><a style="padding:10px; color: #1e9dcf;" href="/reset-password" target="angular" style="color: #5791C8;">{{ forgottenPassword }}</a></p>
        </div>
    </div>`;

const registerTemplate = `
    <style>
        .login-input:focus {
            outline: 1px solid #333;
        }

        #submitform:focus {
            background: #dbdbdb;
        }
    </style>

    <div class="login-form" style="font-family: sans-serif; display: flex; flex-direction: column; justify-content: end;">
        <div>
            <div style="font-size: 12px; color: #e47979;" id="email_error"></div>
            <label for="email" style="text-align: left; margin-top: 20px; color: #9D9D9D;">{{ email }}</label> <br>
            <input class="login-input" type="email" style="padding: 1em 0px 1em 15px; width: calc(100% - 15px); border: 1px solid #404040; border-radius: 4px; margin-bottom: 20px; margin-top: 5px;" id='email' name='cdf_identifiantInput'><br>

            <div style="font-size: 12px; color: #e47979;" id="pwd_error"></div>
            <label for="password" style="text-align: left; margin-top: 20px; color: #9D9D9D;">{{ password }}</label> <br>
            <input class="login-input" type="password" style="padding: 1em 0px 1em 15px; width: calc(100% - 15px); border: 1px solid #404040; border-radius: 4px; margin-bottom: 20px; margin-top: 5px;" id='password' name='cdf_passwordInput'> <br>

            <div style="font-size: 12px; color: #e47979;" id="confirm_pwd_error"></div>
            <label for="password" style="text-align: left; margin-top: 20px; color: #9D9D9D;">{{ confirmPassword }}</label> <br>
            <input class="login-input" type="password" style="padding: 1em 0px 1em 15px; width: calc(100% - 15px); border: 1px solid #404040; border-radius: 4px; margin-bottom: 20px; margin-top: 5px;" id='confirmPassword' name='cdf_passwordInput'> <br>

            <div style="font-size: 12px; color: #e47979;" id="cgu_error"></div>
            <div style="display: flex;">
                <input class="login-input" type="checkbox" style="align-self: center; padding: 1em 0px 1em 15px; width: calc(100% - 15px); border: 1px solid #404040; border-radius: 4px; margin-bottom: 5px; margin-top: 5px; width: 6%;" id='cgu' name='cguckbx'> <br>
                <label id="cguckbx_label" for="cguckbx" style="text-align: left; font-size: 14px; margin-top: 4px; color: #9D9D9D; margin-left: 3px;">{{ cgu }}</label> <br>
            </div>
            <div style="color: #c4c4c4; text-align:justify; font-size: 11px; width:100%;">
                <p>{{ cguText }}</p>
            </div>

            <button id="submitform" type="submit" style="cursor: pointer; padding: 1em; margin-top: 20px; width: 100%; background: F3F3F3; border: 1px solid #e2e2e2; border-radius: 5px; cursor: pointer; font-size: 16px; color: #707070;" value="Se connecter">{{ register }}</button>
            <div style="text-align: center; font-size: 14px; margin-top: 30px; color: #c4c4c4;">
                <p style="padding:10px; margin-bottom: 35px;"><a style="padding:10px; color: #1e9dcf;" href="/login" target="angular" style="color: #5791C8;">{{ hasAccount }}</a></p>
            </div>
        </div>
    </div>`;

const modifyPasswordTemplate = `
    <style>
        .login-input:focus {
            outline: 1px solid #333;
        }

        #submitform:focus {
            background: #dbdbdb;
        }
    </style>

    <div class="login-form" style="font-family: sans-serif;">

        <div style="font-size: 12px; color: #e47979;" id="modifyPassword_error"></div>

        <label for="password" style="text-align: left; margin-top: 20px; color: #9D9D9D;">{{ newPassword }}</label> <br>
        <input class="login-input" type="password" style="padding: 1em 0px 1em 15px; width: calc(100% - 15px); border: 1px solid #404040; border-radius: 4px; margin-bottom: 20px; margin-top: 5px;" id='password' name='password'> <br>

        <div style="font-size: 12px; color: #e47979;" id="confirmModifyPassword_error"></div>
        <label for="confirmPassword" style="text-align: left; margin-top: 20px; color: #9D9D9D;">{{ confirmPassword }}</label> <br>
        <input class="login-input" type="password" style="padding: 1em 0px 1em 15px; width: calc(100% - 15px); border: 1px solid #404040; border-radius: 4px; margin-bottom: 20px; margin-top: 5px;" id='confirmPassword' name='modifyPassword'> <br>

        <button id="submitform" type="submit" style="cursor: pointer; padding: 1em; margin-top: 20px; width: 100%; background: F3F3F3; border: 1px solid #e2e2e2; border-radius: 5px; cursor: pointer; font-size: 16px; color: #707070;" value="Se connecter">{{ validate }}</button>
    </div>`;

const resetPasswordTemplate = `
    <style>
        .login-input:focus {
            outline: 1px solid #333;
        }

        #submitform:focus {
            background: #dbdbdb;
        }
    </style>

    <div class="login-form" style="font-family: sans-serif;">
        <div style="font-size: 12px; color: #e47979;" id="mail_error"></div>
        <label for="email" style="text-align: left; margin-top: 20px; color: #9D9D9D;">{{ email }}</label> <br>
        <input class="login-input" type="email" style="padding: 1em 0px 1em 15px; width: calc(100% - 15px); border: 1px solid #404040; border-radius: 4px; margin-bottom: 20px; margin-top: 5px;" id='cdf_identifiantInput' id='email' name='email'><br>

        <button id="submitform" type="submit" style="cursor: pointer; padding: 1em; margin-top: 20px; width: 100%; background: F3F3F3; border: 1px solid #e2e2e2; border-radius: 5px; cursor: pointer; font-size: 16px; color: #707070;" value="Se connecter">{{ reset }}</button>
    </div>`;

module.exports = { loginTemplate, registerTemplate, resetPasswordTemplate, modifyPasswordTemplate };