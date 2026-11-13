
    // Move the existing controls without replacing their state or event handlers.
    const classNavigation = document.getElementById('testClassNavigation');
    classNavigation.append(document.getElementById('btnNavStudentsTop'));
    const termButtons = [...document.querySelectorAll('.term-btn')];
    const termGroup = termButtons[0] && termButtons[0].parentElement;
    document.getElementById('testTermNavigation').append(...termButtons);
    document.getElementById('testReportNavigation').append(document.getElementById('btnNavGlobalReport'));
    if (termGroup) termGroup.remove();
    const subjectNavigation = document.getElementById('testSubjectNavigation');
    subjectNavigation.insertBefore(
      document.getElementById('subjectTabsContainer'),
      document.getElementById('subjectSubTabsContainer')
    );
    const originalBrand = document.querySelector('.test-original-brand');
    if (originalBrand) originalBrand.remove();
