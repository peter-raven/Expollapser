namespace UnitTests
{
    using System;
    using System.Text;
    using System.Text.RegularExpressions;
    using System.Threading;

    using NUnit.Framework;

    using Selenium;

    public class SeleniumQUnitTestRunner : IJavasriptUnitTestRunner
    {
        private readonly string _browserCode;
        private ISelenium selenium;
        private StringBuilder verificationErrors;

        public SeleniumQUnitTestRunner(string browserCode)
        {
            _browserCode = browserCode;
        }

        public string GetJavaScriptUnitTestResultsElement(string testPageUrl)
        {
            SetupSeleniumFixture();
            selenium.Open(testPageUrl);
            for (int second = 0; ; second++)
            {
                if (second >= 60) Assert.Fail("timeout");
                try
                {
                    if (Regex.IsMatch(selenium.GetText("qunit-testresult"), "^Tests completed[\\s\\S]*$")) break;
                }
                catch (Exception)
                { }
                Thread.Sleep(1000);
            }

            string res = "<ol>" + selenium.GetEval("this.browserbot.findElement('id=qunit-tests').innerHTML") + "</ol>";
            selenium.Close();
            selenium.Stop();

            return res;
        }

        public void SetupSeleniumFixture()
        {
            selenium = new DefaultSelenium("localhost", 4444, _browserCode, "http://blank.org");
            selenium.Start();
            verificationErrors = new StringBuilder();
        }
    }
}