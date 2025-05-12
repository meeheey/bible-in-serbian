from django import forms
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm

class CustomSetPasswordForm(SetPasswordForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['new_password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Нова лозинка.'
        })
        self.fields['new_password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Понови лозинку.'
        })

class CustomPasswordResetForm(PasswordResetForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'].label = 'Е-пошта'
        self.fields['email'].error_messages = {
            'required': 'Молимо унесите адресу електронске поште.',
            'invalid': 'Унесите исправну адресу електронске поште.'
        }
        self.fields['email'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Унеси адресу електронске поште.'
        })

class CustomSetPasswordForm(SetPasswordForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        self.fields['new_password1'].label = 'Нова лозинка'
        self.fields['new_password1'].error_messages = {
            'required': 'Молимо унесите нову лозинку.'
        }
        self.fields['new_password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Нова лозинка.'
        })

        self.fields['new_password2'].label = 'Понови лозинку'
        self.fields['new_password2'].error_messages = {
            'required': 'Молимо поновите лозинку.',
            'password_mismatch': 'Лозинке се не поклапају.'
        }
        self.fields['new_password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Понови лозинку.'
        })

class EmailForm(forms.Form):
    name = forms.CharField(
        label='Име и презиме',
        max_length=100,
        error_messages={
            'required': 'Молимо унесите ваше име и презиме.'
        }
    )
    email = forms.EmailField(
        label='Е-пошта',
        error_messages={
            'required': 'Молимо унесите адресу електронске поште.',
            'invalid': 'Унесите исправну адресу електронске поште.'
        }
    )
    subject = forms.CharField(
        label='Наслов',
        max_length=200,
        error_messages={
            'required': 'Молимо унесите наслов поруке.'
        }
    )
    message = forms.CharField(
        label='Порука',
        widget=forms.Textarea,
        error_messages={
            'required': 'Молимо унесите текст поруке.'
        }
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['name'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Унеси своје име и презиме.'
        })
        self.fields['email'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Унеси адресу електронске поште.'
        })
        self.fields['subject'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Наслов поруке.'
        })
        self.fields['message'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Унеси поруку овде.',
            'rows': 5
        })
