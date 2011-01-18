namespace UnitTests
{
    using System.Collections.Generic;
    using System.Linq;

    using NUnit.Framework;

    [TestFixture]
    public abstract class JavaScriptUnitTestBase
    {
        private readonly IJavasriptUnitTestRunner _runner;
        private readonly IJavascriptTestResultsParser _resultsParser;

        public JavaScriptUnitTestBase(IJavasriptUnitTestRunner runner, IJavascriptTestResultsParser resultsParser)
        {
            this._runner = runner;
            this._resultsParser = resultsParser;
        }

        public virtual string[] QUnitTestUrls
        {
            get
            {
                return new string[] { };
            }
        }

        [Test]
        public void QUnit([ValueSource("ExtractQUnitTests")] JavascriptUnitTest test)
        {
            test.ShouldPass();
        }

        public IEnumerable<JavascriptUnitTest> ExtractQUnitTests()
        {
            return QUnitTestUrls.SelectMany(url => _resultsParser.GetTestResults(_runner.GetJavaScriptUnitTestResultsElement(url), url));
        }
    }
}