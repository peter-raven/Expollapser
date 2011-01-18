namespace UnitTests
{
    using System.Collections.Generic;

    public interface IJavascriptTestResultsParser
    {
        IEnumerable<JavascriptUnitTest> GetTestResults(string resultHtml, string pageUrl);
    }
}