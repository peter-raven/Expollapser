using System;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using NUnit.Framework;
using Selenium;

namespace SeleniumTests
{
[TestFixture]
public class SeleniumFixture
{
private ISelenium selenium;
private StringBuilder verificationErrors;

[SetUp]
public void SetupTest()
{
selenium = new DefaultSelenium("localhost", 4444, "*chrome", "file:///C:/Data/Documents/Code_Private/Expander/Tests/Fixture.htm");
selenium.Start();
verificationErrors = new StringBuilder();
}

[TearDown]
public void TeardownTest()
{
try
{
selenium.Stop();
}
catch (Exception)
{
// Ignore errors if unable to close the browser
}
Assert.AreEqual("", verificationErrors.ToString());
}

[Test]
public void TheSeleniumFixtureTest()
{
			selenium.Open("file:///C:/Data/Documents/Code_Private/Expander/Tests/Fixture.htm");
			for (int second = 0;; second++) {
				if (second >= 60) Assert.Fail("timeout");
				try
				{
					if (Regex.IsMatch(selenium.GetText("qunit-testresult"), "^Tests completed[\\s\\S]*$")) break;
				}
				catch (Exception)
				{}
				Thread.Sleep(1000);
			}
			try
			{
				Assert.IsTrue(selenium.IsTextPresent("0 failed"));
			}
			catch (AssertionException e)
			{
				verificationErrors.Append(e.Message);
			}
}
}
}
