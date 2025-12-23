from django import forms

class AirportSearchForm(forms.Form):
    search = forms.CharField(
        label='',
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={
            'placeholder': 'Поиск по названию, городу или коду...',
            'class': 'autocomplete-input',
            'id':'search-input',
            'autocomplete': 'off'
        })
    )
  