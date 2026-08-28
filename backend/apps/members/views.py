from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, DetailView
from .models import Member
from .forms import MemberForm


class MemberListView(ListView):
    model = Member
    template_name = 'members/member_list.html'
    context_object_name = 'members'

    def get_queryset(self):
        queryset = super().get_queryset()
        is_founder = self.request.GET.get('is_founder')
        if is_founder == 'true':
            queryset = queryset.filter(is_founder=True)
        status = self.request.GET.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset


class MemberDetailView(DetailView):
    model = Member
    template_name = 'members/member_detail.html'
    context_object_name = 'member'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Payment history requires payments app; wire this up once that model exists:
        # context['payments'] = self.object.payments.all().order_by('-date')
        return context


def member_create(request):
    if request.method == 'POST':
        form = MemberForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('member-list')
    else:
        form = MemberForm()
    return render(request, 'members/member_form.html', {'form': form, 'title': 'Додати члена'})


def member_edit(request, pk):
    member = get_object_or_404(Member, pk=pk)
    if request.method == 'POST':
        form = MemberForm(request.POST, instance=member)
        if form.is_valid():
            form.save()
            return redirect('member-detail', pk=member.pk)
    else:
        form = MemberForm(instance=member)
    return render(request, 'members/member_form.html', {'form': form, 'title': 'Редагувати члена'})