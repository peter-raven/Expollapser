namespace UnitTests
{
    using System;
    using System.Diagnostics;
    using System.Threading;

    using NUnit.Framework;

    [TestFixture]
    public class QUnitTests : JavaScriptUnitTestBase, IDisposable
    {
        private static Process _selProcess;

        public QUnitTests()
            : base(new SeleniumQUnitTestRunner(), new QUnitTestResultsParser())
        {
            if (_selProcess == null)
            {
                /*
                var starter = new ProcessStartInfo(
                    @"C:\Program Files (x86)\Java\jre6\bin\java.exe",
                    @"-jar C:\selenium-server-1.0.3\selenium-server.jar");
                starter.UseShellExecute = true;
                _selProcess = Process.Start(starter);
                Thread.Sleep(3000);
                */
            }
        }

        public override string[] QUnitTestUrls
        {
            get
            {
                return new[] { "file:///C:/Data/Documents/Code_Private/Expollapser/Tests/Fixture.htm" };
            }
        }

        public void Dispose()
        {
            if (_selProcess != null)
            {
                _selProcess.CloseMainWindow();
                _selProcess.WaitForExit(2000);
                _selProcess.Close();
            }

            _selProcess.Dispose();
            _selProcess = null;
        }
    }
}